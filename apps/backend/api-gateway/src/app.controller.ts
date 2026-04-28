import { All, Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // ── Service URLs ────────────────────────────────────────────────────────────
  private readonly services: Record<string, string> = {
    planning:     process.env.GESTION_PLANING_URL      ?? 'http://localhost:3002',
    planing:      process.env.GESTION_PLANING_URL      ?? 'http://localhost:3002',
    notification: process.env.NOTIFICATION_SERVICE_URL ?? 'http://localhost:3004',
    videocall:    process.env.VIDEOCALL_SERVICE_URL    ?? 'http://localhost:9000',
    'video-call': process.env.VIDEOCALL_SERVICE_URL    ?? 'http://localhost:9000',
    // gestion-site uses /api global prefix → include it in base URL
    sites:        (process.env.GESTION_SITE_URL        ?? 'http://localhost:3001') + '/api',
    // gestion-projects has no global prefix
    projects:     process.env.GESTION_PROJECTS_URL     ?? 'http://localhost:3010',
  };

  // ── Generic proxy ───────────────────────────────────────────────────────────
  private async proxy(
    req: Request,
    res: Response,
    serviceKey: string,
    stripPrefix: string,
  ): Promise<void> {
    const baseUrl = this.services[serviceKey];
    if (!baseUrl) {
      res.status(502).json({ message: `Unknown service: ${serviceKey}` });
      return;
    }

    const pathAndQuery = req.originalUrl.replace(
      new RegExp(`^/${stripPrefix}`),
      '',
    );

    // Build upstream URL — append path to base (don't use new URL() which drops base path)
    const base = baseUrl.replace(/\/$/, '');
    const path = pathAndQuery.startsWith('/') ? pathAndQuery : `/${pathAndQuery}`;
    const upstreamUrl = `${base}${path || '/'}`;

    let targetUrl: URL;
    try {
      targetUrl = new URL(upstreamUrl);
    } catch {
      res.status(400).json({ message: 'Invalid upstream URL' });
      return;
    }

    // Forward headers (skip hop-by-hop)
    const forwardedHeaders = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined) continue;
      const lower = key.toLowerCase();
      if (lower === 'host' || lower === 'content-length') continue;
      if (Array.isArray(value)) {
        value.forEach((v) => forwardedHeaders.append(key, v));
      } else {
        forwardedHeaders.set(key, value);
      }
    }

    // Build body
    const supportsBody = !['GET', 'HEAD'].includes(req.method.toUpperCase());
    let body: BodyInit | undefined;
    if (supportsBody && req.body != null) {
      if (typeof req.body === 'string') {
        body = req.body;
      } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(req.body)) {
        body = new Uint8Array(req.body as Buffer);
      } else {
        body = JSON.stringify(req.body);
      }
    }

    try {
      const upstream = await fetch(targetUrl.toString(), {
        method: req.method,
        headers: forwardedHeaders,
        body,
      });

      res.status(upstream.status);
      upstream.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'transfer-encoding') return;
        res.setHeader(key, value);
      });

      res.send(await upstream.text());
    } catch (err: any) {
      res
        .status(502)
        .json({ message: 'Bad Gateway', detail: err?.message ?? 'upstream unreachable' });
    }
  }

  // ── Health check ────────────────────────────────────────────────────────────
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // ── Planning ────────────────────────────────────────────────────────────────
  @All(['planing', 'planing/*path', 'planning', 'planning/*path'])
  handlePlanning(@Req() req: Request, @Res() res: Response) {
    const prefix = req.originalUrl.startsWith('/planning') ? 'planning' : 'planing';
    return this.proxy(req, res, prefix, prefix);
  }

  // ── Notification ────────────────────────────────────────────────────────────
  @All(['notification', 'notification/*path'])
  handleNotification(@Req() req: Request, @Res() res: Response) {
    return this.proxy(req, res, 'notification', 'notification');
  }

  // ── Video call ──────────────────────────────────────────────────────────────
  @All(['videocall', 'videocall/*path', 'video-call', 'video-call/*path'])
  handleVideocall(@Req() req: Request, @Res() res: Response) {
    const prefix = req.originalUrl.startsWith('/video-call') ? 'video-call' : 'videocall';
    return this.proxy(req, res, prefix, prefix);
  }

  // ── Gestion Sites ───────────────────────────────────────────────────────────
  @All(['sites', 'sites/*path'])
  handleSites(@Req() req: Request, @Res() res: Response) {
    return this.proxy(req, res, 'sites', 'sites');
  }

  // ── Gestion Projects ────────────────────────────────────────────────────────
  @All(['projects', 'projects/*path'])
  handleProjects(@Req() req: Request, @Res() res: Response) {
    return this.proxy(req, res, 'projects', 'projects');
  }
}
