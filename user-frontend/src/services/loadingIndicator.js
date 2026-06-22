const LOADING_START_EVENT = "app:loading-start";
const LOADING_END_EVENT = "app:loading-end";

let loadingRequestId = 0;

export const startGlobalLoading = (source = "action") => {
  const id = `${source}:${++loadingRequestId}`;
  window.dispatchEvent(new CustomEvent(LOADING_START_EVENT, { detail: { id } }));
  return id;
};

export const finishGlobalLoading = (id) => {
  if (!id) return;
  window.dispatchEvent(new CustomEvent(LOADING_END_EVENT, { detail: { id } }));
};

export const withGlobalLoading = async (action, source) => {
  const id = startGlobalLoading(source);

  try {
    return await action();
  } finally {
    finishGlobalLoading(id);
  }
};

export const loadingIndicatorEvents = {
  start: LOADING_START_EVENT,
  end: LOADING_END_EVENT,
};
