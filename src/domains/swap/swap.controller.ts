import { type Errback, type Request, type Response } from 'express'
import { setSwapPrivateData } from './swap.service'

export const open = (req: Request, res: Response, next: Errback) => {
  setSwapPrivateData(req.body)
    .then((result) => res.json(result))
    .catch((err) => {
      next(err)
    })
}
