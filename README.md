## 문제

`HttpModule`을 통해 `http` 요청을 보낼 때,

- 매 `request`마다 `headers`의 `Authorization` 필드에 `Bearer Token`을 자동으로 실어 보내는 방법이 있을까?
- `access token`이 만료되었을 때, 자동으로 `access token`을 갱신할 수 있을까?

## 해결

`HttpModule`은 `Axios`를 래핑하여 구현되어 있으므로, `Axios`에서 요청과 응답을 중간에서 가로챌 수 있는 `Interceptors`를 통해 해결할 수 있었습니다.

이미 `Axios Interceptors`를 사용할 수 있는 패키지(https://github.com/narando/nest-axios-interceptor)가 존재하고 있었습니다.
해당 패키지의 사용을 고려하였으나, 다음의 이유로 장기간 유지보수가 안 되고 있다고 느껴졌습니다.

- 마지막 커밋이 `2years ago`이다.
- `HttpModule`을 `@nestjs/axios`가 아닌 `@nestjs/common(deprecated)`에서 `import` 했다.

그래서 직접 구현하는 방법을 선택했습니다.

## 해결 과정

다음의 Repo에 전체 코드를 올려 두었습니다.
https://github.com/ykoh42/ykoh42.github.io/tree/%40nestjs/axios-interceptors

### 1. Install

`HttpModule`을 사용하기 위해 다음의 `dependency`를 설치합니다.

```bash
npm i --save @nestjs/axios
```

### 2. HttpModule

사용할 모듈에 `HttpModule`을 import 합니다. 아래 코드에서는 편의상 `AppModule`에서 작성하였습니다.

commit: https://github.com/ykoh42/ykoh42.github.io/commit/f3b506a2e020ad8fa3d0e7c65a97f2332c2a4c47

```ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [HttpModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

---

`Axios Interceptors`를 사용하기 위해서는 모듈이 init 될 때 `interceptor`를 추가해주어야 합니다.
다음 코드와 같이 `OnModuleInit` 인터페이스를 통해 `onModuleInit`의 구현을 강제해줍니다.

commit: https://github.com/ykoh42/ykoh42.github.io/commit/81abf2d196c5d867614f33eda55f1e67445aad07

```ts
import { Module, OnModuleInit } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [HttpModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  onModuleInit() {
    // register interceptors in here
  }
}
```

---

`interceptor`를 등록하기 전에 `Axios Interceptors`가 무엇인지 살펴봅시다(https://axios-http.com/kr/docs/interceptors).

간단히 말하면 `request`과 `response`을 `intercept`해서 별도의 추가작업을 할 수 있습니다.
아래 코드의 주석을 살펴보시면 명확히 이해가 되실 겁니다.

```ts
// 요청 인터셉터 추가하기
axios.interceptors.request.use(
  function (config) {
    // 요청이 전달되기 전에 작업 수행
    return config;
  },
  function (error) {
    // 요청 오류가 있는 작업 수행
    return Promise.reject(error);
  },
);

// 응답 인터셉터 추가하기
axios.interceptors.response.use(
  function (response) {
    // 2xx 범위에 있는 상태 코드는 이 함수를 트리거 합니다.
    // 응답 데이터가 있는 작업 수행
    return response;
  },
  function (error) {
    // 2xx 외의 범위에 있는 상태 코드는 이 함수를 트리거 합니다.
    // 응답 오류가 있는 작업 수행
    return Promise.reject(error);
  },
);
```

---

위의 코드를 `NestJS`에서 적용하려면, `httpService`에서 `axios` 인스턴스를 가져와서 `interceptor`를 등록해주어야 합니다.
비교해서 보기 쉽게 같은 주석을 달아두었습니다.

commit: https://github.com/ykoh42/ykoh42.github.io/commit/c88086b5e0e3a99176deccd53cfc8aa16ca7d4d0

```ts
import { Module, OnModuleInit } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [HttpModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly httpService: HttpService) {}

  onModuleInit() {
    // 요청 인터셉터 추가하기
    this.httpService.axiosRef.interceptors.request.use(
      (config) => {
        // 요청이 전달되기 전에 작업 수행
        return config;
      },
      (error) => {
        // 요청 오류가 있는 작업 수행
        return Promise.reject(error);
      },
    );

    // 응답 인터셉터 추가하기
    this.httpService.axiosRef.interceptors.response.use(
      (response) => {
        // 2xx 범위에 있는 상태 코드는 이 함수를 트리거 합니다.
        // 응답 데이터가 있는 작업 수행
        return response;
      },
      (error) => {
        // 2xx 외의 범위에 있는 상태 코드는 이 함수를 트리거 합니다.
        // 응답 오류가 있는 작업 수행
        return Promise.reject(error);
      },
    );
  }
}
```

이제 위의 코드를 활용하여, 원하는 방식대로 구현할 수 있습니다.

> 이후의 내용부터는 약간의 응용이며, 커밋 링크를 제공하지 않고, 어떤 식으로 활용할 수 있는지 정도로 봐주시면 좋을 것 같습니다.

## 3. `Authorization` 필드에 `Bearer Token`을 자동으로 실어 보내기

다음과 같은 방식으로 매 요청 시 `Bearer Token`을 실어 보낼 수 있습니다.

```ts
this.httpService.axiosRef.interceptors.request.use((config) => {
  config.headers['Authorization'] = `bearer ${tokenStorage.accessToken}`;
  return config;
});
```

토큰을 저장하는 방법은 별도로 고민하셔야할 부분입니다.

## 4. `access token`이 만료되었을 때, 자동으로 갱신하기

`refresh token`이 제공된다면, `refresh token`으로 `access token`을 갱신할 수도 있습니다만, 제가 사용하고 있는 API에서는 `access token`만 존재하여, `access token`을 갱신하는 예제로 구성하였습니다.

```ts
this.httpService.axiosRef.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;

      const accessTokenConfig = {
        grant_type: 'client_credentials',
        client_id: this.configService.get('FT_CLIENT_ID'),
        client_secret: this.configService.get('FT_CLIENT_SECRET'),
      };

      await firstValueFrom(
        this.httpService
          .post('https://api.intra.42.fr/oauth/token', accessTokenConfig)
          .pipe(
            map(({ data }) => data),
            pluck('access_token'),
            tap((accessToken) => console.log(accessToken)),
            tap(() => this.logger.log('access token refreshed')),
            tap((accessToken) => (tokenStorage.accessToken = accessToken)),
          ),
      );
      return this.httpService.axiosRef(error.config);
    }
    return Promise.reject(error);
  },
);
```

토큰 요청은 1회만 수행하기 위해, `error.config._retry` 라는 property를 추가하여, 1회만 수행하도록 구현하였고,
`observable`을 `firstValueFrom`을 통해 `promise`로 변환하여 처리하였습니다.

---

## 회고

처음에는 토큰을 갱신하기 위해 `cron`이나 `interval`같은 `Task Scheduling`으로 해결하려고 생각했습니다. 그러나 `Axios Interceptors`가 더 적합한 방법이었던 것 같고, 그 외에도 `service` 구현 부에서 처리할 수도 있었겠지만, `Axios Interceptors`로 로직을 분리함으로써, `service`에서는 좀 더 `service` 로직에 집중한 코드를 작성할 수 있었습니다.

## Reference

- [https://docs.nestjs.kr/techniques/http-module](https://docs.nestjs.kr/techniques/http-module)
- [https://axios-http.com/kr/docs/interceptors](https://axios-http.com/kr/docs/interceptors)
- [https://www.bezkoder.com/axios-interceptors-refresh-token/](https://www.bezkoder.com/axios-interceptors-refresh-token/)
