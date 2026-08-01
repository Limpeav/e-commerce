import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { createAlertMessageComponent } from "../../../../shared-frontend/components/AlertMessage.jsx";

const AlertMessage = createAlertMessageComponent({ React, CheckCircle, AlertCircle, X });

export default AlertMessage;
