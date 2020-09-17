"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_LISTENERS = exports.SNS_LISTENER = exports.HTTP_LISTENER = void 0;
exports.HTTP_LISTENER = {
    event: "http",
    port: 4001,
};
exports.SNS_LISTENER = {
    event: "sns",
    port: 4002,
};
exports.SUPPORTED_LISTENERS = [exports.HTTP_LISTENER, exports.SNS_LISTENER];
