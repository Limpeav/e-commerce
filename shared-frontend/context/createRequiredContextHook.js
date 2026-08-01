export const createRequiredContextHook = (useContext, Context, hookName, providerName) => () => {
  const context = useContext(Context);
  if (!context) {
    throw new Error(`${hookName} must be used within a ${providerName}`);
  }

  return context;
};
