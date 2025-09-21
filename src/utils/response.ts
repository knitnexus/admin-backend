export const success = (data: any, message = "Success") => ({
    success: true,
    message,
    data,
});

export const failure = (message = "Failed", data: any = null) => ({
    success: false,
    message,
    data,
});
