import { Response } from "express"

export function throwUnauthorized(res: Response, message: string) {
  return res.status(401).json({
    message,
  })
}

export function throwNotFound(res: Response, message: string) {
  return res.status(404).json({
    message,
  })
}

export function throwNotAcceptable(res: Response, message: string) {
  return res.status(406).json({
    message,
  })
}
