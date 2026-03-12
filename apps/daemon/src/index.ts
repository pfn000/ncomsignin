import 'dotenv/config';

import Bonjour from 'bonjour-service';
import express from 'express';
import expressWs from 'express-ws';
import jwt from 'jsonwebtoken';
import mic from 'mic';
import { fft } from 'fft-js';
import DSP from 'dsp.js';
import { createPhysicalFallbackChallenge, deriveNoiseProfile, verifyPhysicalFallback } from './physicalFallback';

const port = Number(process.env.DAEMON_PORT ?? 8787);
const jwtSecret = process.env.JWT_SECRET ?? 'development-secret';
const appBase = express();
const { app } = expressWs(appBase);
const bonjour = new Bonjour();

let currentFallbackChallenge = createPhysicalFallbackChallenge();
const handshakeSessions = new Map<string, { verifiedAtMs: number; trustedOrigin?: string }>();

app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'proximityauth-daemon' });
});

app.post('/verify-token', (req, res) => {
  const token = req.body?.token as string | undefined;
  if (!token) {
    return res.status(400).json({ error: 'token is required' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    return res.json({ valid: true, payload });
  } catch {
    return res.status(401).json({ valid: false });
  }
});

app.post('/fallback/noise-profile', (req, res) => {
  const sampleRateHz = Number(req.body?.sampleRateHz ?? 44100);
  const samples = (req.body?.samples as number[] | undefined) ?? [];
  if (!Array.isArray(samples) || samples.length === 0) {
    return res.status(400).json({ error: 'samples are required' });
  }

  const noiseProfile = deriveNoiseProfile(samples, sampleRateHz);
  return res.json(noiseProfile);
});

app.post('/fallback/challenge', (req, res) => {
  const sampleRateHz = Number(req.body?.sampleRateHz ?? 44100);
  const samples = (req.body?.samples as number[] | undefined) ?? [];
  const noiseProfile = samples.length > 0 ? deriveNoiseProfile(samples, sampleRateHz) : undefined;
  currentFallbackChallenge = createPhysicalFallbackChallenge(noiseProfile);
  res.json(currentFallbackChallenge);
});

app.post('/fallback/verify', (req, res) => {
  const proof = req.body?.proof;
  const sampleRateHz = Number(req.body?.sampleRateHz ?? 44100);
  const samples = (req.body?.samples as number[] | undefined) ?? [];

  if (!proof || !Array.isArray(samples) || samples.length === 0) {
    return res.status(400).json({ error: 'proof and samples are required' });
  }

  const result = verifyPhysicalFallback(currentFallbackChallenge, proof, samples, sampleRateHz);

  if (result.accepted) {
    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    handshakeSessions.set(sessionId, {
      verifiedAtMs: Date.now(),
      trustedOrigin: req.body?.trustedOrigin
    });

    return res.json({ ...result, sessionId });
  }

  return res.json(result);
});

app.get('/extension/session/:sessionId', (req, res) => {
  const session = handshakeSessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ active: false });
  }

  if (Date.now() - session.verifiedAtMs > 30_000) {
    handshakeSessions.delete(req.params.sessionId);
    return res.status(410).json({ active: false, expired: true });
  }

  return res.json({ active: true, ...session });
});

app.ws('/proximity', (ws) => {
  ws.on('message', (rawData) => {
    const input = rawData.toString().split(',').map(Number).filter(Number.isFinite);
    if (input.length === 0) {
      ws.send(JSON.stringify({ type: 'error', message: 'empty signal data' }));
      return;
    }

    const bins = fft(input);
    const magnitudes = bins.map((pair: [number, number]) => Math.hypot(pair[0], pair[1]));
    const maxMagnitude = Math.max(...magnitudes);
    const normalized = maxMagnitude / input.length;

    const lowPass = new DSP.IIRFilter(DSP.LOWPASS, 18000, 44100);
    const filtered = input.map((sample) => lowPass.process(sample));

    ws.send(
      JSON.stringify({
        type: 'signal-analysis',
        normalized,
        filteredPeak: Math.max(...filtered)
      })
    );
  });
});

app.listen(port, () => {
  bonjour.publish({
    name: 'ProximityAuth Desktop Daemon',
    type: 'proximityauth',
    port
  });

  const micInstance = mic({ rate: '44100', channels: '1', debug: false, exitOnSilence: 0 });
  const micInput = micInstance.getAudioStream();
  micInput.on('error', () => undefined);

  console.log(`Daemon listening on ${port}`);
});
