import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export interface NotificationStatus {
  granted: boolean;
  platform: 'native' | 'web';
}

/**
 * Verifica se está rodando no aplicativo nativo (APK Android/iOS) ou na Web
 */
export const isNativePlatform = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

/**
 * Solicita permissão para exibir pop-ups e notificações
 */
export const requestAppNotificationsPermission = async (): Promise<NotificationStatus> => {
  if (isNativePlatform()) {
    try {
      const res = await LocalNotifications.requestPermissions();
      const granted = res.display === 'granted';
      return { granted, platform: 'native' };
    } catch (e) {
      console.warn('Erro ao solicitar permissão no Capacitor:', e);
      return { granted: false, platform: 'native' };
    }
  }

  // Fallback para Web / PWA
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      return { granted: permission === 'granted', platform: 'web' };
    } catch (e) {
      console.warn('Erro ao solicitar permissão na Web:', e);
      return { granted: false, platform: 'web' };
    }
  }

  return { granted: false, platform: 'web' };
};

/**
 * Dispara vibração tátil no celular
 */
export const triggerAppVibration = async (heavy = true): Promise<void> => {
  if (isNativePlatform()) {
    try {
      if (heavy) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } else {
        await Haptics.impact({ style: ImpactStyle.Medium });
      }
      return;
    } catch (e) {
      console.warn('Erro no Haptics:', e);
    }
  }

  // Fallback para navegadores com navigator.vibrate
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(heavy ? [300, 100, 300] : [150]);
    } catch {}
  }
};

/**
 * Toca áudio sintetizado de alerta para garantir aviso mesmo no modo silencioso parcial
 */
export const playAlertBeep = (): void => {
  if (typeof window === 'undefined') return;
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
    osc.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.15); // D6
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.45);
  } catch {}
};

let webTimerTimeoutId: NodeJS.Timeout | null = null;

/**
 * Agenda notificação nativa para o fim do tempo de descanso (funciona em 2º plano / celular bloqueado)
 */
export const scheduleRestNotification = async (
  seconds: number,
  exerciseName = 'Exercício'
): Promise<void> => {
  if (seconds <= 0) return;

  if (isNativePlatform()) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: 1001 }] });
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 1001,
            title: '⏱️ Descanso Concluído!',
            body: `Hora da próxima série de ${exerciseName}. Bora pra cima!`,
            schedule: { at: new Date(Date.now() + seconds * 1000) },
            sound: 'beep.wav',
            actionTypeId: '',
            extra: {
              type: 'REST_TIMER',
              exerciseName,
            },
          },
        ],
      });
      return;
    } catch (e) {
      console.warn('Falha ao agendar no LocalNotifications:', e);
    }
  }

  // Web fallback: timeout + Service Worker notification
  if (webTimerTimeoutId) {
    clearTimeout(webTimerTimeoutId);
    webTimerTimeoutId = null;
  }

  webTimerTimeoutId = setTimeout(async () => {
    triggerAppVibration(true);
    playAlertBeep();

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification('⏱️ Descanso Concluído!', {
            body: `Hora da próxima série de ${exerciseName}!`,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            vibrate: [200, 100, 200, 100, 200],
            tag: 'rest-timer',
          } as any);
        } else {
          new Notification('⏱️ Descanso Concluído!', {
            body: `Hora da próxima série de ${exerciseName}!`,
            icon: '/favicon.svg',
          });
        }
      } catch (e) {
        console.warn('Erro ao disparar notificação web:', e);
      }
    }
  }, seconds * 1000);
};

/**
 * Cancela notificação de descanso (se o atleta iniciar a série antes do tempo acabar)
 */
export const cancelRestNotification = async (): Promise<void> => {
  if (isNativePlatform()) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: 1001 }] });
    } catch {}
  }
  if (webTimerTimeoutId) {
    clearTimeout(webTimerTimeoutId);
    webTimerTimeoutId = null;
  }
};

/**
 * Agenda lembretes diários recorrentes (Treino do Dia e Questionário Noturno)
 */
export const scheduleDailyHabitReminders = async (): Promise<void> => {
  if (!isNativePlatform()) return;

  try {
    // 1. Lembrete Diário de Treino (08:00)
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 2001,
          title: '⚔️ NIFLHEIM — Treino do Dia',
          body: 'Consulte a ficha de hoje e execute sua progressão tripla de carga!',
          schedule: {
            on: { hour: 8, minute: 0 },
            allowWhileIdle: true,
          },
        },
        // 2. Lembrete Noturno de Recuperação (21:30)
        {
          id: 2002,
          title: '🌙 NIFLHEIM — Avaliação de Recuperação',
          body: 'Como foi sua recuperação hoje? Ajuste o volume semanal para amanhã.',
          schedule: {
            on: { hour: 21, minute: 30 },
            allowWhileIdle: true,
          },
        },
      ],
    });
  } catch (e) {
    console.warn('Erro ao configurar lembretes diários:', e);
  }
};
