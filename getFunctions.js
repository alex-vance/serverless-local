"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getFunctions(sls) {
    return sls.service.getAllFunctions().map(function (fn) { return sls.service.getFunction(fn); });
}
exports.default = getFunctions;
;
