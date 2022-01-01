import { Controller, Get, Post, Req } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('login')
  async logIn(@Req() req) {
    req.session.user = { id: 20 };
    await req.session.save();
    return 'ok';
  }

  @Get('profile')
  profile(@Req() req) {
    if (req.session.user === undefined) {
      return 'user undefined';
    }
    return req.session.user;
  }

  @Post('logout') // use post to prevent cached
  async logOut(@Req() req) {
    req.session.destroy();
    return 'logout ok';
  }
}
