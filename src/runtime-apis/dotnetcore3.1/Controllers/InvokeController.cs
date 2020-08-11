using System;
using Microsoft.AspNetCore.Mvc;
using Amazon.Lambda.APIGatewayEvents;
using dotnetcore31;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;

namespace Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class InvokeController : ControllerBase
    {
        private readonly IEnumerable<HandlerInfo> _handlers;

        public InvokeController(IEnumerable<HandlerInfo> handlers)
        {
            _handlers = handlers;
        }

        [HttpPost("execute-api")]
        public IActionResult ExecuteApi()
        {
            var handler = _handlers.FirstOrDefault();

            LocalLogger.Log($"Handler - {handler.Handler}");
            LocalLogger.Log($"Type - {handler.Type.Name}");
            LocalLogger.Log($"Method - {handler.Method.Name}");
            LocalLogger.Log($"Paramters - {handler.Parameters.Length}");
            LocalLogger.Log($"Instance - {handler.Instance ?? "null"}");

            var parameters = new object[handler.Parameters.Length];
            var result = handler.Method.Invoke(handler.Instance, parameters);
            var json = JsonConvert.SerializeObject(result);

            LocalLogger.Log($"Result: {json}");

            var response = new APIGatewayProxyResponse { StatusCode = 200, Body = json };

            return Ok(response);
        }

        [HttpPost("sns")]
        public IActionResult Sns()
        {
            return Ok();
        }
    }
}