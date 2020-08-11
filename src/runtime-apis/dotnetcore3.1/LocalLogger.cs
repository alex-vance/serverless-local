using System;

namespace dotnetcore31
{
    public static class LocalLogger
    {
        public static void Log(string msg)
        {
            Console.WriteLine($"[local]: {msg}");
        }
    }
}