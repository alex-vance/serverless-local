using System;
using Microsoft.AspNetCore.Mvc;
using Amazon.Lambda.APIGatewayEvents;

namespace Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class InvokeController : ControllerBase
    {
        [HttpPost("execute-api")]
        public IActionResult ExecuteApi()
        {
            var response = new APIGatewayProxyResponse { StatusCode = 200, Body = "successful call" };

            return Ok(response);
        }
    }
}