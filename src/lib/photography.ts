export type PhotographyAsset = {
  src: `/images/kpopsoft/${string}.jpg`;
  alt: string;
  position?: string;
};

export const photography = {
  about: {
    brandWall: {
      src: "/images/kpopsoft/about-brand-wall.jpg",
      alt: "햇살이 비치는 벽면에 설치된 KPOPSOFT 로고",
      position: "center",
    },
    headquarters: {
      src: "/images/kpopsoft/about-headquarters.jpg",
      alt: "나무와 유리 외벽이 어우러진 KPOPSOFT 사옥 전경",
      position: "center",
    },
  },
  software: {
    collaboration: {
      src: "/images/kpopsoft/software-collaboration.jpg",
      alt: "모니터의 코드를 함께 검토하는 KPOPSOFT 개발팀",
      position: "center",
    },
    dashboard: {
      src: "/images/kpopsoft/software-dashboard.jpg",
      alt: "노트북에서 데이터 대시보드를 개발하고 확인하는 장면",
      position: "center",
    },
    workstation: {
      src: "/images/kpopsoft/software-workstation.jpg",
      alt: "코드와 서비스 설계 화면이 열린 듀얼 모니터 개발 환경",
      position: "center",
    },
    sketch: {
      src: "/images/kpopsoft/software-sketch.jpg",
      alt: "노트에 서비스 화면과 흐름을 직접 설계하는 장면",
      position: "center",
    },
  },
  education: {
    workshop: {
      src: "/images/kpopsoft/education-workshop.jpg",
      alt: "화면의 서비스 구조를 보며 진행하는 소규모 실무 교육",
      position: "center",
    },
    classroom: {
      src: "/images/kpopsoft/education-classroom.jpg",
      alt: "수강생들이 노트북으로 참여하는 KPOPSOFT 강의 현장",
      position: "center",
    },
  },
  b2b: {
    lounge: {
      src: "/images/kpopsoft/b2b-lounge.jpg",
      alt: "라운지에서 프로젝트를 논의하는 KPOPSOFT 팀",
      position: "center",
    },
    meetingRoom: {
      src: "/images/kpopsoft/b2b-meeting-room.jpg",
      alt: "유리 회의실에서 노트북을 펼치고 협업하는 팀",
      position: "center",
    },
  },
} as const satisfies Record<string, Record<string, PhotographyAsset>>;

export const photographyAssets = Object.values(photography).flatMap((group) =>
  Object.values(group),
);
