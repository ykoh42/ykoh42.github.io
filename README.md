`stateless session`을 찾다가 [iron-session](https://github.com/vvo/iron-session)을 발견했는데, `NestJS`와 함께 사용할 수 있는 녀석이라 사용해보았습니다.

'블로그에 글을 작성할 필요가 있을까?' 싶을 정도로 사용이 간단하지만,

`NestJS`와 함께 사용하는 예제는 보지 못해서 작성해보았습니다(`express`에서 사용하는 방법과 동일).

## What is `iron-session`?

_🛠 Node.js stateless session utility using signed and encrypted cookies to store data. Works with Next.js, Express, NestJs, Fastify, and any Node.js HTTP framework._

The session data is stored in encrypted cookies ("seals"). And only your server can decode the session data. There are no session ids, making iron sessions "stateless" from the server point of view.

---

### 1. Nest 프로젝트 만들기 https://github.com/ykoh42/ykoh42.github.io/commit/2e205405ad5541a090efdce764a269b78074bdc8

```sh
nest new iron-session
```

### 2. iron-session install https://github.com/ykoh42/ykoh42.github.io/commit/a745fd687f140f8d5896ed3f2adcef91924b722e

```sh
npm i iron-session
```

### 3. iron-session 미들웨어 사용하기 https://github.com/ykoh42/ykoh42.github.io/commit/c9a4e0936b0f18ccd737ab8dcf2e04867929c399

#### main.ts

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ironSession } from 'iron-session/express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const session = ironSession({
    cookieName: 'iron-session/examples/express',
    password: process.env.SECRET_COOKIE_PASSWORD,
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
    },
  });
  app.use(session);

  await app.listen(3000);
}
bootstrap();
```

### 4. `req.session` 사용하기 https://github.com/ykoh42/ykoh42.github.io/commit/ec7af3b2dc47eba326bc302d2ac1c525c33822f7

컨트롤러에 다음과 같이 3가지 API를 만들도록 하겠습니다.

| Method | URI        | Desc                           |
| ------ | ---------- | ------------------------------ |
| `GET`  | `/login`   | 로그인                         |
| `GET`  | `/profile` | 로그인해야만 볼 수 있는 페이지 |
| `POST` | `/login`   | 로그아웃                       |

#### app.controller.ts

```ts
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
```

### 5. `SECRET_COOKIE_PASSWORD` 환경변수 설정하기 https://github.com/ykoh42/ykoh42.github.io/commit/d3665f47241a1ed6f6b837fcc3b76bffef8ec62a

#### package.json

```json
    "start:dev": "SECRET_COOKIE_PASSWORD=Zp-p!QhpyU_0q!@taxoceA.4q35B7@4q nest start --watch",
```

### 6. 실행 및 확인

```sh
npm run start:dev
```

#### `GET` `/profile` 로 요청을 보내면 다음과 같은 응답이 나타납니다.

```
user undefined
```

#### `GET` `/login`으로 요청을 보내서 로그인 한 뒤, 다시 `GET` `profile`로 요청을 보내면 다음과 같은 응답이 나타납니다.

```json
{
  "id": 20
}
```

로그인 시 다음의 이미지와 같이 `iron-session/examples/express`쿠키가 생성된 것을 확인할 수 있습니다.

<img width="658" alt="Screen Shot 2022-01-01 at 8 06 59 PM" src="https://user-images.githubusercontent.com/16534576/147849212-17371079-8e00-4e27-87a9-6ec36d218580.png">

#### `POST` `/logout`으로 요청을 보낸 뒤, 다시 `GET` `profile`로 요청을 보내면 다음과 같은 응답이 나타납니다.

```
user undefined
```

로그아웃 시 `iron-session/examples/express`쿠키가 제거됩니다.

<img width="264" alt="Screen Shot 2022-01-01 at 8 09 00 PM" src="https://user-images.githubusercontent.com/16534576/147849243-196bbbec-d372-4c77-aaef-2adb0c97d236.png">

## 정리

위의 과정을 통해서 `stateless session`인 `iron-session`을 `NestJS`에서 사용하는 방법을 살펴보았고, 전체 코드는 [여기](https://github.com/ykoh42/ykoh42.github.io/tree/%40nestjs/iron-session)에서 확인할 수 있습니다.

실제 production에서 사용하시려면 아래 reference의 문서를 잘 살펴보시길 바랍니다(특히, 보안 관련 사항).

## Reference

- https://github.com/vvo/iron-session
- https://github.com/vvo/iron-session/tree/main/examples/express
