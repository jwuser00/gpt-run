# 세션 요약: 클라우드 배포 전략 리서치 및 의사결정

- **날짜**: 2026-03-01
- **프로젝트**: vibe-test (Running Management App)
- **브랜치**: main
- **세션 유형**: 리서치 / 아키텍처 의사결정 (코드 변경 없음)

---

## 배경 및 목적

현재 프로젝트(React + FastAPI + SQLite, Docker 구성 완료)를 클라우드에 배포하기 위한 전략을 수립하기 위해 각 클라우드 서비스를 서베이하고, 프로젝트 요구사항에 맞는 최적 배포 방식을 결정함.

---

## 리서치 내용

### 1. 클라우드 배포 옵션 전체 서베이

4가지 카테고리로 분류하여 조사:

#### 1-1. 컨테이너 기반 (Docker 활용)
| 서비스 | 특징 | 비용 | 난이도 |
|--------|------|------|--------|
| AWS ECS (Fargate) | 서버리스 컨테이너, AWS 생태계 통합 | 사용량 기반, 소규모 월 $10~30 | 중 |
| Google Cloud Run | 요청 기반 과금, 자동 스케일링, 0까지 축소 | 무료 티어 있음 | 하 |
| Azure Container Apps | 서버리스 컨테이너, Dapr 통합 | 무료 티어 있음 | 중 |
| Fly.io | Docker 이미지 직접 배포, 글로벌 엣지 | 무료 티어(3개 VM), 이후 ~$5/월 | 하 |
| Railway | Git push 배포, Docker 자동 감지 | 무료 티어 제한적, 이후 $5~/월 | 최하 |

#### 1-2. PaaS
| 서비스 | 특징 | 비용 | 난이도 |
|--------|------|------|--------|
| Render | Git 연동 자동 배포, Web Service + Static Site 분리 | 무료 티어 있음(슬립), 유료 $7~/월 | 최하 |
| Heroku | 전통적 PaaS, 빌드팩 자동 감지 | Eco $5/월, Basic $7/월 | 최하 |
| Vercel(프론트) + Render(백엔드) | 프론트 최적화 + 백엔드 분리 | 각각 무료 티어 | 하 |

#### 1-3. VPS
| 서비스 | 특징 | 비용 | 난이도 |
|--------|------|------|--------|
| AWS EC2 | 완전한 제어권 | t3.micro 무료 1년, 이후 ~$10/월 | 상 |
| **Oracle Cloud** | **Always Free 티어(ARM 4코어/24GB)** | **무료 (기간 제한 없음)** | 상 |
| Vultr / DigitalOcean | 단순한 VPS, 고정 가격 | $4~6/월부터 | 중 |

#### 1-4. 서버리스 분리 배포
- 프론트: Vercel / Netlify / CloudFront+S3
- 백엔드: AWS Lambda + API Gateway (Mangum 어댑터)
- DB: SQLite → PostgreSQL(Supabase/Neon) 전환 필요

### 2. SQLite 제약 분석

SQLite는 파일 기반 DB이므로 배포 환경에 따라 제약 존재:
- **서버리스 환경** (Lambda, Cloud Run 0 스케일): 데이터 유실 위험
- **다중 인스턴스**: 동시 쓰기 불가
- **대안**:
  - 단일 인스턴스 유지 (Fly.io, Render, VPS) → SQLite 그대로 사용 가능 (볼륨 마운트)
  - DB 전환: PostgreSQL or MySQL
  - LiteFS / Turso: SQLite 분산 솔루션

---

## 의사결정 사항

### 결정 1: DB를 MySQL 계열로 전환
- **결정**: SQLite → MySQL 전환
- **이유**: 클라우드 배포 시 파일 기반 DB의 한계, 운영 안정성

### 결정 2: 추가 서비스/데몬 없음
- **결정**: 현재 구성(프론트 + 백엔드 + DB) 외 서비스 추가하지 않음
- **이유**: 개인 프로젝트로 복잡도 최소화

### 결정 3: 배포 플랫폼 → Oracle Cloud Free Tier
- **결정**: Oracle Cloud Always Free ARM VM 사용
- **선정 이유**:
  - 완전 무료 (기간 제한 없음, Always Free)
  - ARM VM 최대 4코어 / 24GB RAM / 200GB 스토리지 → 개인 서비스에 충분
  - Docker 기반: VM에서 docker-compose 그대로 실행
  - MySQL 컨테이너를 docker-compose에 포함하면 별도 관리형 DB 불필요
- **탈락 사유 (다른 옵션)**:
  - Fly.io: MySQL을 별도 앱으로 띄워야 함, 무료 VM 메모리 256MB로 MySQL 운영 어려움
  - Railway: 진정한 무료 아님 ($5/월 크레딧 소진 후 과금)
  - Render: 무료 티어 15분 미사용 시 슬립, 관리형 MySQL 없음
  - Google Cloud: e2-micro 1GB RAM → MySQL과 앱 동시 운영 힘듦

### 결정 4: 배포 구조 → 단일 VM + docker-compose
- **결정**: 하나의 VM에서 docker-compose로 모든 서비스 실행
- **구성**:
  ```
  [ Oracle Cloud ARM VM (4코어 / 24GB) ]
  └── docker-compose
      ├── nginx      (:80, :443)  ← 프론트 정적파일 + 리버스 프록시
      ├── fastapi    (:8000)      ← 백엔드 API
      └── mysql      (:3306)      ← DB (볼륨 마운트로 데이터 영속)
  ```
- **이유**: 개인 서비스에 VM 분리는 과잉 설계, 4코어/24GB면 충분

### 결정 5: IaC → Terraform 사용
- **결정**: Terraform으로 인프라 코드화
- **확인 사항**:
  - Oracle Cloud는 Terraform 공식 지원 (oracle/oci Provider)
  - OCI Resource Manager: 콘솔에서 Terraform plan/apply 실행 + state 관리 가능
  - Ansible, Pulumi도 지원하지만 Terraform이 표준

---

## 다음 단계 (TODO)

### 1단계: 애플리케이션 변경 (로컬)
- [ ] SQLite → MySQL 전환 (`database.py`, `models.py` 수정, MySQL 드라이버 추가)
- [ ] docker-compose.yml 수정 (MySQL 컨테이너 추가, 볼륨 마운트, 환경변수)
- [ ] nginx 설정 보완 (HTTPS/Let's Encrypt, 리버스 프록시)
- [ ] 환경변수 분리 (`.env` 파일로 시크릿 관리: DB 비밀번호, JWT 시크릿 등)
- [ ] 로컬에서 MySQL 기반 동작 확인

### 2단계: 인프라 코드 (Terraform)
- [ ] OCI Provider 설정 (인증 정보, 컴파트먼트 구성)
- [ ] 네트워크 리소스 (VCN, 서브넷, 인터넷 게이트웨이, 시큐리티 리스트: 80, 443, 22)
- [ ] VM 인스턴스 정의 (Always Free ARM - VM.Standard.A1.Flex, 4코어/24GB)
- [ ] cloud-init 스크립트 (Docker/Docker Compose 자동 설치)

### 3단계: 배포 자동화
- [ ] 배포 스크립트 (SSH로 소스 전송 → docker-compose up)

**순서**: 1단계(앱 변경) → 로컬 검증 → 2단계(인프라) → 3단계(배포)

---

## 변경 파일

커밋 없음 (리서치/의사결정 세션, 코드 변경 없음)

---

## 참고 정보

### Oracle Cloud Always Free 스펙
- ARM (Ampere A1): 최대 4 OCPU, 24GB RAM
- Boot Volume: 200GB
- 네트워크: 월 10TB Outbound
- 기간 제한 없음 (Always Free)

### Terraform OCI Provider 예시
```hcl
terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 5.0"
    }
  }
}

resource "oci_core_instance" "app_server" {
  shape = "VM.Standard.A1.Flex"
  shape_config {
    ocpus         = 4
    memory_in_gbs = 24
  }
}
```
