using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using System;

namespace dotnetcore31
{
    public class Program
    {
        public const int ERROR_BAD_ARGUMENTS = 0xA0;

        public static void Main(string[] args)
        {
            if (args == null || args.Length <= 0)
            {
                LocalLogger.Log("No handlers found, exiting runtime-api");

                Environment.ExitCode = ERROR_BAD_ARGUMENTS;

                return;
            }

            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) => Host.CreateDefaultBuilder(args)
            .ConfigureWebHostDefaults(webBuilder => { webBuilder.UseStartup<Startup>(); })
            .ConfigureLambdas(args);
    }
}
