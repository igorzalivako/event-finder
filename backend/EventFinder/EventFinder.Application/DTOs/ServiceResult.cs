namespace EventFinder.Application.DTOs
{
    public record ServiceResult(bool Success, string Message, string? ErrorCode = null)
    {
        public ServiceResultCode ResultCode { get; set; }

        public static ServiceResult Ok(string message) 
        {
            var result = new ServiceResult(true, message) { ResultCode = ServiceResultCode.Ok };
            return result;
        }

        public static ServiceResult Fail(string errorCode, string message)
        {
            var result = new ServiceResult(false, message, errorCode) { ResultCode = ServiceResultCode.Fail };
            return result;
        }

        public static ServiceResult Conflict(string errorCode, string message)
        {
            var result = new ServiceResult(false, message, errorCode) { ResultCode = ServiceResultCode.Conflict };
            return result;
        }

        public static ServiceResult MailSendFail(string errorCode, string message)
        {
            var result = new ServiceResult(false, message, errorCode) { ResultCode = ServiceResultCode.MailSendFail };
            return result;
        }

        public static ServiceResult NotFound(string message)
        {
            var result = new ServiceResult(false, message, "") { ResultCode = ServiceResultCode.NotFound };
            return result;
        }
    }

    public enum ServiceResultCode
    {
        Ok,
        Conflict,
        MailSendFail,
        Fail,
        NotFound
    }
}
