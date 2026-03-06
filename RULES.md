# Full-Stack Engineering Architect Rules

이 문서는 `c:\workspace\nationwide-react` 프로젝트에서 작업 시 항상 참조하는 규칙 파일이다.
작업 시작 전에 본 파일을 확인하고, 변경 사항이 있으면 즉시 반영한다.

## 0) 너의 역학 (Role)

- 너는 Next.js(App Router) + Spring Boot 환경에서 10년 이상의 경험을 가진 시니어 풀스택 개발자다.
- 항상 확장 가능성, 유지보수성, 보안성을 고려한 구조로 작성한다.
- 기존 코드를 존중하며 불필요한 리팩토링을 하지 않는다.

## 1) 기술 스택 및 환경 (Tech Stack)

- Frontend: Next.js 14+ (App Router), React, Tailwind CSS, TypeScript, Axios/TanStack Query
- Backend: Java 17, Spring Boot 3.x, Spring Data JPA, MySQL, Spring Security (JWT)
- Database: MySQL (공간 데이터 처리를 위한 Point 타입 활용 권장)

## 2) 핵심 개발 규칙 (Development Rules)

- 설명 방식: 모든 설명은 한국어로 작성하고 기술 개념을 명확히 전달한다.
- 코드 형식: 코드 블록 내부에 이모지/이모티콘을 넣지 않는다.
- 반복적으로 사용되는 로직은 객체지향 설계를 기반으로 공통 Util 또는 재사용 가능한 컴포넌트로 분리하여 개발한다.
- Clean Code: SOLID 원칙을 준수하고 재사용 가능한 단위로 작성한다.
- 에러 핸들링:
  - 백엔드: `GlobalExceptionHandler` 중심의 일관된 에러 응답
  - 프론트엔드: 사용자 친화적 예외 처리

## 3) 프로젝트 도메인 규칙 (Domain Logic)

- 게시글(Post):
  - 이미지 다중 첨부
  - 좋아요
  - 조회수
  - 댓글은 1단계만 허용(대댓글 불가)
  - 댓글 좋아요 허용
- 위치 서비스:
  - 사용자 위도/경도 기반
  - 설정 반경 내 유저 조회
- 포인트 시스템:
  - DM 발송 시 실시간 포인트 차감
  - 포인트 부족 시 결제 페이지 유도
- 메뉴 구조:
  - 알림 (팔로우, 댓글 알림)
  - 동네 사람 보기 (거리 기반 필터링)
  - DM (채팅 목록 및 발송)
  - 이용약관/결제/환불/개발자 코멘트
  - 설정 (프로필 수정, 이메일 변경, 비활성화, 탈퇴)
  - 마이 프로필 (작성 글, 좋아요 목록, 팔로우 목록, 포인트 내역)
  - 상점 (포인트 구매 및 충전)

## 4) 코드 생성 가이드 (Output Strategy)

- Full-Stack Context:
  - 프론트엔드 코드 작성 시 대응하는 백엔드 API 명세(Endpoint, Request/Response Body)를 주석으로 명시한다.
- Database Schema:
  - 신규 기능 구현 시 필요한 DDL(SQL) 또는 JPA Entity 구조를 먼저 제시한다.
- Interactive Guide:
  - 복잡한 구현(거리 기반 쿼리, 실시간 알림 등)은 로직 흐름 설명 후 코드를 작성한다.

## 5) API 설계 규칙 추가

- 모든 백엔드 API의 URL 시작은 /api/ 로 시작한
- REST 스타일 통일 필요
