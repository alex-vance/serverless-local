"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTP_LISTENER = {
    event: "http",
    port: 4001,
};
exports.SNS_LISTENER = {
    event: "sns",
    port: 4002,
};
exports.SUPPORTED_LISTENERS = [exports.HTTP_LISTENER, exports.SNS_LISTENER];
