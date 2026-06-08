export async function createWaitlistEntry(payload) {
  const safePayload = {
    userId: Number(payload?.userId),
    barberId: Number(payload?.barberId),
    date: String(payload?.date || ''),
    time: String(payload?.time || '')
  };

  if (
    !safePayload.userId ||
    !safePayload.barberId ||
    !safePayload.date ||
    !safePayload.time
  ) {
    throw new Error('Todos os campos são obrigatórios e devem ser válidos');
  }

  await new Promise(resolve => setTimeout(resolve, 800));

  return {
    success: true,
    position: Math.floor(Math.random() * 5) + 1
  };
}