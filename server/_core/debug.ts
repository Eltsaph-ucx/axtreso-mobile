import express from "express";

export function debugMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  console.log("[DEBUG] Request received");
  console.log("[DEBUG] URL:", req.url);
  console.log("[DEBUG] Method:", req.method);
  console.log("[DEBUG] Headers:", req.headers);
  console.log("[DEBUG] Body:", req.body);
  
  // Store the original send function
  const originalSend = res.send;
  
  // Override send to log responses
  res.send = function(data: any) {
    console.log("[DEBUG] Response:", typeof data === "string" ? data.substring(0, 200) : data);
    return originalSend.call(this, data);
  };
  
  next();
}
