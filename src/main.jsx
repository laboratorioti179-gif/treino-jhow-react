import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import {
  getReminderTimes,
  isNativeApp,
  requestWebNotificationPermission,
  scheduleNativeWaterReminders,
  showWebHydrationNotification,
  testNativeNotification,
} from './notifications.js';

const workouts = {
  segunda: {
    label: 'Segunda',
    title: 'Pernas',
    subtitle: 'Treino de inferiores',
    exercises: [
      { id: 'seg-extensora', name: 'Cadeira extensora', sets: 3, reps: '20', note: 'Isometria de 2 s quando estender a perna', motion: 'kneeExtension' },
      { id: 'seg-flexora', name: 'Cadeira flexora', sets: 3, reps: '20', note: 'Isometria de 2 s quando flexionar a perna', motion: 'kneeCurl' },
      { id: 'seg-adutora', name: 'Cadeira adutora', sets: 3, reps: '20', note: 'Isometria de 2 s quando fechar a perna', motion: 'adduction' },
      { id: 'seg-abdutora', name: 'Cadeira abdutora', sets: 3, reps: '20', note: 'Isometria de 2 s quando abrir as pernas', motion: 'abduction' },
      { id: 'seg-legpress', name: 'Leg press', sets: 4, reps: 'até 12', note: '', motion: 'legPress' },
      { id: 'seg-agachamento', name: 'Agachamento livre', sets: 4, reps: '12', note: '', motion: 'squat' },
      { id: 'seg-mesaflexora', name: 'Mesa flexora', sets: 4, reps: 'até 12', note: '', motion: 'kneeCurl' }
    ]
  },
  terca: {
    label: 'Terça',
    title: 'Dorsais, bíceps e ombros',
    subtitle: 'Treino de superiores',
    exercises: [
      { id: 'ter-puxada', name: 'Puxada aberta', sets: 3, reps: '20', note: 'Isometria de 2 s quando puxar a barra', motion: 'pulldown' },
      { id: 'ter-remada-art', name: 'Remada articulada sentado unilateral', sets: 4, reps: 'até 12', note: '', motion: 'row' },
      { id: 'ter-remada-curvada', name: 'Remada curvada', sets: 4, reps: 'até 10', note: 'Pesado', motion: 'row' },
      { id: 'ter-remada-triangulo', name: 'Remada triângulo sentado', sets: 3, reps: 'até 10', note: 'Pesado; isometria quando puxar a barra', motion: 'row' },
      { id: 'ter-rosca', name: 'Rosca alternada', sets: 3, reps: 'até 10', note: 'Repetições lentas', motion: 'curl' },
      { id: 'ter-elevacao', name: 'Elevação lateral com halteres', sets: 3, reps: '20', note: 'Até 10 kg', motion: 'lateralRaise' }
    ]
  },
  quinta: {
    label: 'Quinta',
    title: 'Pernas',
    subtitle: 'Treino de inferiores',
    exercises: [
      { id: 'qui-extensora', name: 'Cadeira extensora', sets: 3, reps: '20', note: 'Isometria de 2 s quando estender a perna', motion: 'kneeExtension' },
      { id: 'qui-flexora', name: 'Cadeira flexora', sets: 3, reps: '20', note: 'Isometria de 2 s quando flexionar a perna', motion: 'kneeCurl' },
      { id: 'qui-adutora', name: 'Cadeira adutora', sets: 3, reps: '20', note: 'Isometria de 2 s quando fechar a perna', motion: 'adduction' },
      { id: 'qui-abdutora', name: 'Cadeira abdutora', sets: 3, reps: '20', note: 'Isometria de 2 s quando abrir as pernas', motion: 'abduction' },
      { id: 'qui-legpress', name: 'Leg press', sets: 4, reps: 'até 12', note: '', motion: 'legPress' },
      { id: 'qui-agachamento', name: 'Agachamento livre', sets: 4, reps: '12', note: '', motion: 'squat' },
      { id: 'qui-mesaflexora', name: 'Mesa flexora', sets: 4, reps: 'até 12', note: '', motion: 'kneeCurl' }
    ]
  },
  sexta: {
    label: 'Sexta',
    title: 'Peito, tríceps e ombros',
    subtitle: 'Treino de superiores',
    exercises: [
      { id: 'sex-crossover', name: 'Cross over ou peck deck', sets: 4, reps: '20', note: '', motion: 'chestFly' },
      { id: 'sex-supino-reto', name: 'Supino reto articulado ou halteres', sets: 4, reps: 'até 10', note: '', motion: 'chestPress' },
      { id: 'sex-supino-inclinado', name: 'Supino inclinado com halteres', sets: 4, reps: 'até 12', note: '', motion: 'chestPress' },
      { id: 'sex-elevacao', name: 'Elevação lateral com halteres', sets: 3, reps: 'até 20', note: '', motion: 'lateralRaise' },
      { id: 'sex-desenvolvimento', name: 'Desenvolvimento com halteres', sets: 3, reps: 'até 12', note: '', motion: 'overheadPress' },
      { id: 'sex-triceps-corda', name: 'Tríceps corda', sets: 3, reps: 'até 12', note: '', motion: 'pushdown' },
      { id: 'sex-triceps-frances', name: 'Tríceps francês', sets: 3, reps: '20', note: '', motion: 'overheadExtension' }
    ]
  }
};

const dayOrder = ['segunda', 'terca', 'quinta', 'sexta'];

function storageKey(suffix) {
  return `jhow-${suffix}`;
}

function todayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function safeJSONParse(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function currentMinuteKey() {
  const now = new Date();
  return `${todayKey()}-${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function MovementDemo({ type }) {
  const labels = {
    kneeExtension: 'Extensão de joelho', kneeCurl: 'Flexão de joelho', adduction: 'Fechar pernas', abduction: 'Abrir pernas',
    legPress: 'Empurrar plataforma', squat: 'Agachamento', pulldown: 'Puxada', row: 'Remada', curl: 'Rosca', lateralRaise: 'Elevação lateral',
    chestFly: 'Adução dos braços', chestPress: 'Empurrar', overheadPress: 'Elevar acima da cabeça', pushdown: 'Empurrar para baixo', overheadExtension: 'Extensão de tríceps'
  };
  return (
    <div className={`movement movement--${type}`} aria-label={`Animação ilustrativa: ${labels[type] || 'movimento'}`}>
      <svg viewBox="0 0 140 120" role="img">
        <circle className="head" cx="70" cy="21" r="9" />
        <line className="body" x1="70" y1="31" x2="70" y2="68" />
        <g className="arms">
          <line x1="70" y1="42" x2="48" y2="58" />
          <line x1="70" y1="42" x2="92" y2="58" />
        </g>
        <g className="legs">
          <line x1="70" y1="68" x2="52" y2="90" />
          <line x1="70" y1="68" x2="88" y2="90" />
          <line x1="52" y1="90" x2="47" y2="110" />
          <line x1="88" y1="90" x2="93" y2="110" />
        </g>
        <g className="weights">
          <circle cx="43" cy="62" r="4" />
          <circle cx="97" cy="62" r="4" />
        </g>
        <line className="floor" x1="20" y1="111" x2="120" y2="111" />
      </svg>
      <span>{labels[type] || 'Movimento'}</span>
    </div>
  );
}

function WaterGlass({ amount, goal }) {
  const pct = Math.min(100, Math.round((amount / goal) * 100));
  return (
    <div className="water-stage">
      <div className="glass" aria-label={`${pct}% da meta de água`}>
        <div className="water" style={{ height: `${pct}%` }}>
          <div className="wave wave-a" />
          <div className="wave wave-b" />
        </div>
        <div className="water-percent">{pct}%</div>
      </div>
      <div className="water-total"><strong>{amount.toLocaleString('pt-BR')} ml</strong><span>de {goal.toLocaleString('pt-BR')} ml</span></div>
    </div>
  );
}

function App() {
  const [activeDay, setActiveDay] = useState(() => {
    const n = new Date().getDay();
    if (n === 1) return 'segunda';
    if (n === 2) return 'terca';
    if (n === 4) return 'quinta';
    if (n === 5) return 'sexta';
    return 'segunda';
  });

  const [completedByDate, setCompletedByDate] = useState(() => {
    const saved = safeJSONParse(storageKey('completed-by-date'), null);
    if (saved) return saved;

    // Migra os "feitos" da versão anterior para a data atual.
    const legacy = safeJSONParse(storageKey('completed'), {});
    return Object.keys(legacy).length ? { [todayKey()]: legacy } : {};
  });
  const [weights, setWeights] = useState(() => safeJSONParse(storageKey('weights'), {}));
  const [water, setWater] = useState(() => {
    const saved = safeJSONParse(storageKey('water'), {});
    return saved.date === todayKey() ? saved.amount || 0 : 0;
  });
  const [goal, setGoal] = useState(() => Number(localStorage.getItem(storageKey('water-goal'))) || 2500);
  const [customWater, setCustomWater] = useState('');
  const [reminders, setReminders] = useState(() => safeJSONParse(storageKey('water-reminders'), {
    enabled: false,
    intervalMinutes: 60,
    startTime: '08:00',
    endTime: '22:00',
  }));
  const [notificationStatus, setNotificationStatus] = useState('');
  const [lastWebAlarm, setLastWebAlarm] = useState('');

  const today = todayKey();
  const completed = completedByDate[today] || {};

  useEffect(() => localStorage.setItem(storageKey('completed-by-date'), JSON.stringify(completedByDate)), [completedByDate]);
  useEffect(() => localStorage.setItem(storageKey('weights'), JSON.stringify(weights)), [weights]);
  useEffect(() => localStorage.setItem(storageKey('water'), JSON.stringify({ date: todayKey(), amount: water })), [water]);
  useEffect(() => localStorage.setItem(storageKey('water-goal'), String(goal)), [goal]);
  useEffect(() => localStorage.setItem(storageKey('water-reminders'), JSON.stringify(reminders)), [reminders]);

  // No navegador/PWA, o lembrete funciona enquanto a página está ativa.
  // No app nativo, o Capacitor agenda notificações do sistema e não depende desta rotina.
  useEffect(() => {
    if (!reminders.enabled || isNativeApp()) return undefined;

    const check = async () => {
      const now = new Date();
      const slots = getReminderTimes(reminders);
      const isSlot = slots.some((slot) => slot.hour === now.getHours() && slot.minute === now.getMinutes());
      const minuteKey = currentMinuteKey();
      if (isSlot && minuteKey !== lastWebAlarm) {
        const shown = await showWebHydrationNotification();
        if (shown) setLastWebAlarm(minuteKey);
      }
    };

    check();
    const timer = window.setInterval(check, 15000);
    return () => window.clearInterval(timer);
  }, [reminders, lastWebAlarm]);

  const workout = workouts[activeDay];
  const doneCount = useMemo(() => workout.exercises.filter((ex) => completed[ex.id]).length, [workout, completed]);
  const progress = Math.round((doneCount / workout.exercises.length) * 100) || 0;

  const toggleExercise = (id) => {
    setCompletedByDate((prev) => ({
      ...prev,
      [today]: {
        ...(prev[today] || {}),
        [id]: !(prev[today] || {})[id],
      },
    }));
  };

  const addWater = (ml) => {
    const amount = Number(ml);
    if (!amount || amount <= 0) return;
    setWater((v) => v + amount);
    setCustomWater('');
  };

  const applyReminders = async () => {
    setNotificationStatus('Configurando lembretes...');
    try {
      if (isNativeApp()) {
        const result = await scheduleNativeWaterReminders(reminders);
        setNotificationStatus(reminders.enabled
          ? `${result.count} horários diários programados no celular.`
          : 'Lembretes desativados.');
      } else if (reminders.enabled) {
        const permission = await requestWebNotificationPermission();
        if (permission === 'granted') {
          setNotificationStatus('Permissão concedida. No navegador, os avisos dependem de a página/PWA estar ativa.');
        } else {
          setNotificationStatus('Permissão de notificação não concedida.');
        }
      } else {
        setNotificationStatus('Lembretes desativados.');
      }
    } catch (error) {
      setNotificationStatus(error?.message === 'notification-permission-denied'
        ? 'Ative as notificações nas configurações do celular.'
        : 'Não foi possível programar as notificações.');
    }
  };

  const testNotification = async () => {
    setNotificationStatus('Enviando teste...');
    try {
      if (isNativeApp()) {
        await testNativeNotification();
        setNotificationStatus('Teste agendado. A notificação deve aparecer em alguns segundos.');
      } else {
        const permission = await requestWebNotificationPermission();
        if (permission !== 'granted') {
          setNotificationStatus('Permissão de notificação não concedida.');
          return;
        }
        const shown = await showWebHydrationNotification();
        setNotificationStatus(shown ? 'Notificação de teste enviada.' : 'Seu navegador bloqueou a notificação.');
      }
    } catch {
      setNotificationStatus('Não foi possível enviar o teste. Confira a permissão de notificações.');
    }
  };

  const reminderTimes = getReminderTimes(reminders);
  const nextTimes = reminderTimes.slice(0, 5).map(({ hour, minute }) => `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <span className="eyebrow">PLANEJAMENTO JHOW</span>
          <h1>Treino de hoje</h1>
          <p>O que for marcado como feito fica salvo neste celular e separado por dia.</p>
        </div>
        <div className="hero-badge"><span>🏋️</span><strong>{doneCount}/{workout.exercises.length}</strong><small>concluídos</small></div>
      </header>

      <section className="day-tabs" aria-label="Dias de treino">
        {dayOrder.map((day) => (
          <button key={day} className={day === activeDay ? 'active' : ''} onClick={() => setActiveDay(day)}>
            <span>{workouts[day].label}</span>
            <small>{workouts[day].title}</small>
          </button>
        ))}
      </section>

      <section className="workout-head">
        <div><span>{workout.subtitle}</span><h2>{workout.title}</h2></div>
        <div className="progress-box"><div className="progress-meta"><span>Progresso de hoje</span><strong>{progress}%</strong></div><div className="progress-track"><div style={{ width: `${progress}%` }} /></div></div>
      </section>

      <section className="exercise-list">
        {workout.exercises.map((ex, index) => (
          <article className={`exercise-card ${completed[ex.id] ? 'done' : ''}`} key={ex.id}>
            <div className="exercise-number">{String(index + 1).padStart(2, '0')}</div>
            <MovementDemo type={ex.motion} />
            <div className="exercise-info">
              <div className="exercise-title-row"><h3>{ex.name}</h3><button className="check-btn" onClick={() => toggleExercise(ex.id)}>{completed[ex.id] ? '✓ Feito hoje' : 'Marcar feito'}</button></div>
              <div className="chips"><span>{ex.sets} séries</span><span>{ex.reps} rep</span></div>
              {ex.note && <p className="note">{ex.note}</p>}
              <label className="weight-field">Carga <input inputMode="decimal" placeholder="ex.: 30 kg" value={weights[ex.id] || ''} onChange={(e) => setWeights((prev) => ({ ...prev, [ex.id]: e.target.value }))} /></label>
            </div>
          </article>
        ))}
      </section>

      <section className="water-card">
        <div className="water-copy"><span className="eyebrow">JOGO DA ÁGUA</span><h2>Encha o copo durante o dia 💧</h2><p>Cada registro fica salvo no celular. O total de água reinicia automaticamente a cada novo dia.</p>
          <div className="quick-water">{[200, 300, 500].map((ml) => <button key={ml} onClick={() => addWater(ml)}>+ {ml} ml</button>)}</div>
          <div className="custom-water"><input type="number" min="1" placeholder="Outra quantidade" value={customWater} onChange={(e) => setCustomWater(e.target.value)} /><button onClick={() => addWater(customWater)}>Adicionar</button></div>
          <div className="goal-row"><label>Meta diária <input type="number" min="500" step="100" value={goal} onChange={(e) => setGoal(Math.max(500, Number(e.target.value) || 2500))} /> ml</label><button className="text-button" onClick={() => setWater(0)}>Zerar hoje</button></div>
        </div>
        <WaterGlass amount={water} goal={goal} />
      </section>

      <section className="reminder-card">
        <div className="reminder-heading">
          <div><span className="eyebrow">ALARME DE HIDRATAÇÃO</span><h2>Lembrar de beber água 🔔</h2></div>
          <label className="switch-row"><input type="checkbox" checked={reminders.enabled} onChange={(e) => setReminders((prev) => ({ ...prev, enabled: e.target.checked }))} /><span>{reminders.enabled ? 'Ativado' : 'Desativado'}</span></label>
        </div>

        <div className="reminder-grid">
          <label>De quanto em quanto
            <select value={reminders.intervalMinutes} onChange={(e) => setReminders((prev) => ({ ...prev, intervalMinutes: Number(e.target.value) }))}>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>1 hora</option>
              <option value={90}>1h30</option>
              <option value={120}>2 horas</option>
              <option value={180}>3 horas</option>
            </select>
          </label>
          <label>Começar às
            <input type="time" value={reminders.startTime} onChange={(e) => setReminders((prev) => ({ ...prev, startTime: e.target.value }))} />
          </label>
          <label>Parar às
            <input type="time" value={reminders.endTime} onChange={(e) => setReminders((prev) => ({ ...prev, endTime: e.target.value }))} />
          </label>
        </div>

        {reminders.enabled && (
          <p className="reminder-preview">Próximos horários do ciclo: {nextTimes.length ? nextTimes.join(' • ') : 'nenhum horário'}{reminderTimes.length > 5 ? ' • …' : ''}</p>
        )}

        <div className="reminder-actions">
          <button className="primary-action" onClick={applyReminders}>Salvar e programar alarmes</button>
          <button className="secondary-action" onClick={testNotification}>Testar notificação</button>
        </div>
        {notificationStatus && <p className="notification-status">{notificationStatus}</p>}
        <p className="reminder-note">No app instalado para Android/iPhone, o lembrete usa a notificação do sistema e o som configurado no próprio celular. No navegador comum, o sistema não consegue garantir o alarme com a página totalmente fechada.</p>
      </section>

      <footer>As animações são ilustrativas para identificar o movimento. Use a orientação do profissional responsável pelo treino para execução e ajustes de carga.</footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

