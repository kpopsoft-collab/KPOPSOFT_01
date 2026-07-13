export type PhotographyAsset = {
  src: `/images/kpopsoft/${string}.jpg`;
  alt: string;
  position?: string;
};

export const photography = {
  about: {
    officeCulture: {
      src: "/images/kpopsoft/about-office-culture.jpg",
      alt: "여러 팀이 테이블에 모여 협업하는 밝은 오픈 오피스",
      position: "center",
    },
  },
  software: {
    collaboration: {
      src: "/images/kpopsoft/software-collaboration.jpg",
      alt: "회의실에서 대형 화면의 서비스 흐름을 설명하고 함께 검토하는 모습",
      position: "center",
    },
    dashboard: {
      src: "/images/kpopsoft/software-dashboard.jpg",
      alt: "AI 워크플로 대시보드가 열린 노트북으로 작업하는 모습",
      position: "center",
    },
    workstation: {
      src: "/images/kpopsoft/software-workstation.jpg",
      alt: "코드와 모바일 화면 설계가 열린 듀얼 모니터 개발 환경",
      position: "center",
    },
    sketch: {
      src: "/images/kpopsoft/software-sketch.jpg",
      alt: "노트에 모바일 대시보드와 화면 흐름을 스케치하는 모습",
      position: "center",
    },
  },
  education: {
    workshop: {
      src: "/images/kpopsoft/education-workshop.jpg",
      alt: "노트북 화면을 함께 보며 실습 내용을 설명하는 소규모 멘토링",
      position: "center",
    },
    classroom: {
      src: "/images/kpopsoft/education-classroom.jpg",
      alt: "수강생들이 노트북으로 AI 워크플로 강의를 듣는 강의실",
      position: "center",
    },
  },
  b2b: {
    lounge: {
      src: "/images/kpopsoft/b2b-lounge.jpg",
      alt: "라운지에서 네 명이 노트북과 메모를 두고 대화하는 모습",
      position: "center",
    },
    meetingRoom: {
      src: "/images/kpopsoft/b2b-meeting-room.jpg",
      alt: "화이트보드의 사용자 흐름을 함께 검토하는 팀 워크숍",
      position: "center",
    },
  },
} as const satisfies Record<string, Record<string, PhotographyAsset>>;

export const photographyAssets = Object.values(photography).flatMap((group) =>
  Object.values(group),
);
