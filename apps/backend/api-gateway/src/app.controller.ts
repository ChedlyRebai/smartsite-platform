import { All, Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  private readonly planningServiceUrl =
    process.env.GESTION_PLANING_URL ?? 'http://localhost:3002';

  private async proxyToPlanning(req: Request, res: Response): Promise<void> {
    const pathAndQuery = req.originalUrl.replace(/^\/(planing|planning)/, '');
    const targetUrl = new URL(pathAndQuery || '/', this.planningServiceUrl);

    const forwardedHeaders = new Headers();

    Object.entries(req.headers).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }

      const lowerKey = key.toLowerCase();

      if (lowerKey === 'host' || lowerKey === 'content-length') {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => forwardedHeaders.append(key, item));
        return;
      }

      forwardedHeaders.set(key, value);
    });

    const supportsBody = !['GET', 'HEAD'].includes(req.method.toUpperCase());
    let body: BodyInit | undefined;

    if (supportsBody && req.body !== undefined && req.body !== null) {
      if (typeof req.body === 'string') {
        body = req.body;
      } else if (Buffer.isBuffer(req.body)) {
        body = new Uint8Array(req.body);
      } else {
        body = JSON.stringify(req.body);
      }
    }

    const upstreamResponse = await fetch(targetUrl, {
      method: req.method,
      headers: forwardedHeaders,
      body,
    });

    res.status(upstreamResponse.status);

    upstreamResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'transfer-encoding') {
        return;
      }
      
      res.setHeader(key, value);
    });

    const rawBody = await upstreamResponse.text();
    res.send(rawBody);
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @All(['planing', 'planing/*path', 'planning', 'planning/*path'])
  async handlePlanningProxy(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.proxyToPlanning(req, res);
  }
}
