export const createAlertMessageComponent = ({ React, CheckCircle, AlertCircle, X }) => {
  const baseClasses = "p-6 rounded-[2.5rem] flex items-start gap-4 shadow-xl animate-slideDown";
  const typeClasses = {
    success: "bg-green-50 text-green-700 border-green-100 shadow-green-900/5",
    error: "bg-red-50 text-red-600 border-red-100 shadow-red-900/5 animate-shake",
    warning: "bg-yellow-50 text-yellow-700 border-yellow-100 shadow-yellow-900/5"
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertCircle
  };

  const colors = {
    success: "text-green-600",
    error: "text-red-600",
    warning: "text-yellow-600"
  };
  const closeButtonClasses = {
    success: "text-green-600 hover:text-green-800",
    error: "text-red-600 hover:text-red-800",
    warning: "text-yellow-600 hover:text-yellow-800",
  };

  const AlertMessage = ({
    type,
    message,
    onClose,
    title
  }) => {
    const Icon = icons[type] || AlertCircle;

    return React.createElement(
      "div",
      { className: `${baseClasses} ${typeClasses[type] || typeClasses.error}` },
      React.createElement(Icon, {
        className: `w-6 h-6 ${colors[type] || colors.error} flex-shrink-0`,
      }),
      React.createElement(
        "div",
        { className: "flex-1" },
        React.createElement(
          "p",
          { className: "text-[10px] font-black uppercase tracking-[0.3em] mb-1" },
          title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Warning')
        ),
        React.createElement(
          "p",
          { className: "font-black uppercase tracking-widest text-xs" },
          message
        )
      ),
      onClose
        ? React.createElement(
            "button",
            {
              onClick: onClose,
              className: `${closeButtonClasses[type] || closeButtonClasses.error} transition-all p-2 hover:bg-white rounded-xl`,
            },
            React.createElement(X, { className: "w-5 h-5" })
          )
        : null
    );
  };

  return AlertMessage;
};
