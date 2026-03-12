import 'dotenv/config';

import Bonjour from 'bonjour-service';
import express from 'express';
import expressWs from 'express-ws';
import jwt from 'jsonwebtoken';
import { fft } from 'fft-js';
import DSP from 'dsp.js';

const port = Number(process.env.DAEMON_PORT ?? 8787);
const jwtSecret = process.env.JWT_SECRET ?? 'development-secret';
const appBase = express();
const { app } = expressWs(appBase);
const bonjour = new Bonjour();

app.use(express.json());

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

app.ws('/proximity', (ws) => {
  ws.on('message', (rawData) => {
    const input = rawData.toString().split(',').map(Number).filter(Number.isFinite);
    if (input.length === 0) {
      ws.send(JSON.stringify({ type: 'error', message: 'empty signal data' }));
      return;
    }

    const bins = fft(input);
    const magnitudes = bins.map(([re, im]) => Math.hypot(re, im));
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

  console.log(`Daemon listening on ${port}`);
});
