using System;

namespace dotnetcore31
{
    public static class LocalLogger
    {
        public static void Log(string msg)
        {
            Console.WriteLine($"[local]: {msg}");
        }

        public static void Error(string msg)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Log(msg);
            Console.ResetColor();
        }
    }
}