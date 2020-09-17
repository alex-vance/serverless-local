"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFunctions = void 0;
function getFunctions(sls) {
    return sls.service.getAllFunctions().map(fn => sls.service.getFunction(fn));
}
exports.getFunctions = getFunctions;
;
