let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function playTone(opts: {
  freq: number; freq2?: number; type?: OscillatorType;
  attack?: number; decay?: number; sustain?: number; release?: number;
  gain?: number; delay?: number;
}) {
  const ac = getCtx();
  const { freq, freq2, type = "sine", attack = 0.01, decay = 0.1, sustain = 0.5, release = 0.3, gain = 0.4, delay = 0 } = opts;
  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.connect(env);
  env.connect(ac.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + delay);
  if (freq2) osc.frequency.linearRampToValueAtTime(freq2, ac.currentTime + delay + attack + decay);
  env.gain.setValueAtTime(0, ac.currentTime + delay);
  env.gain.linearRampToValueAtTime(gain, ac.currentTime + delay + attack);
  env.gain.linearRampToValueAtTime(gain * sustain, ac.currentTime + delay + attack + decay);
  env.gain.linearRampToValueAtTime(0, ac.currentTime + delay + attack + decay + release);
  osc.start(ac.currentTime + delay);
  osc.stop(ac.currentTime + delay + attack + decay + release + 0.05);
}

export const sounds = {
  // Tarefa concluída — três notas ascendentes (alegre)
  taskComplete() {
    playTone({ freq: 523, attack: 0.01, decay: 0.05, release: 0.2, gain: 0.35 });
    playTone({ freq: 659, delay: 0.12, attack: 0.01, decay: 0.05, release: 0.2, gain: 0.35 });
    playTone({ freq: 784, delay: 0.24, attack: 0.01, decay: 0.05, release: 0.3, gain: 0.4 });
  },

  // Tarefa iniciada — clique suave + subida
  taskStart() {
    playTone({ freq: 440, freq2: 520, type: "sine", attack: 0.005, decay: 0.08, release: 0.15, gain: 0.25 });
  },

  // Mensagem recebida — ping duplo
  message() {
    playTone({ freq: 880, attack: 0.005, decay: 0.05, release: 0.12, gain: 0.3 });
    playTone({ freq: 1100, delay: 0.14, attack: 0.005, decay: 0.05, release: 0.12, gain: 0.25 });
  },

  // Lembrete — sino
  reminder() {
    playTone({ freq: 660, type: "sine", attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5, gain: 0.4 });
    playTone({ freq: 990, delay: 0.05, type: "sine", attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.4, gain: 0.2 });
  },

  // Nova conquista — fanfarra
  achievement() {
    [523, 659, 784, 1047].forEach((freq, i) => {
      playTone({ freq, delay: i * 0.1, attack: 0.01, decay: 0.08, release: 0.25, gain: 0.35 });
    });
  },

  // Erro / alerta suave
  error() {
    playTone({ freq: 320, freq2: 240, type: "sine", attack: 0.01, decay: 0.1, release: 0.2, gain: 0.3 });
  },

  // Rotina iniciando — sino suave ascendente (dois bips claros)
  routineStart() {
    playTone({ freq: 528, type: "sine", attack: 0.01, decay: 0.08, sustain: 0.4, release: 0.35, gain: 0.38 });
    playTone({ freq: 792, delay: 0.18, type: "sine", attack: 0.01, decay: 0.06, sustain: 0.3, release: 0.4, gain: 0.32 });
    playTone({ freq: 1056, delay: 0.34, type: "sine", attack: 0.01, decay: 0.05, sustain: 0.2, release: 0.5, gain: 0.28 });
  },

  // Rotina finalizada — descida suave (3 notas caindo)
  routineEnd() {
    playTone({ freq: 784, type: "sine", attack: 0.01, decay: 0.06, sustain: 0.3, release: 0.3, gain: 0.3 });
    playTone({ freq: 659, delay: 0.16, type: "sine", attack: 0.01, decay: 0.06, sustain: 0.3, release: 0.3, gain: 0.26 });
    playTone({ freq: 523, delay: 0.30, type: "sine", attack: 0.01, decay: 0.08, sustain: 0.2, release: 0.45, gain: 0.22 });
  },

  // Aviso de pausa — três pulsos rítmicos de alerta
  breakAlert() {
    [0, 0.22, 0.44].forEach((delay) => {
      playTone({ freq: 440, delay, type: "sine", attack: 0.005, decay: 0.06, sustain: 0.4, release: 0.18, gain: 0.36 });
    });
    playTone({ freq: 330, delay: 0.72, type: "sine", attack: 0.01, decay: 0.12, sustain: 0.3, release: 0.5, gain: 0.28 });
  },
};
