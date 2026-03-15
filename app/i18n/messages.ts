import type { SettingsMenuSlug } from "@/app/components/settings/settingsMenu";

export const defaultLocale = "ko" as const;
export const supportedLocales = ["ko", "en", "ja", "zh-CN"] as const;

export type AppLocale = (typeof supportedLocales)[number];

export type LanguageOption = {
  code: AppLocale;
  nativeLabel: string;
  englishLabel: string;
};

export const supportedLanguages: LanguageOption[] = [
  { code: "ko", nativeLabel: "한국어", englishLabel: "Korean" },
  { code: "en", nativeLabel: "English", englishLabel: "English" },
  { code: "ja", nativeLabel: "日本語", englishLabel: "Japanese" },
  { code: "zh-CN", nativeLabel: "简体中文", englishLabel: "Chinese (Simplified)" },
];

type SettingsMenuCopy = Record<
  SettingsMenuSlug,
  {
    title: string;
    description: string;
  }
>;

type AppMessages = {
  common: {
    confirm: string;
    cancel: string;
  };
  header: {
    login: string;
    register: string;
    logout: string;
    profileAlt: string;
  };
  sidebar: {
    title: string;
    profile: string;
    neighbors: string;
    message: string;
    notification: string;
    support: string;
    setting: string;
    shop: string;
    writePost: string;
    writingPost: string;
    loginRequiredMessage: string;
  };
  settings: {
    heading: string;
    description: string;
    menuAriaLabel: string;
    detailKicker: string;
    backToList: string;
    loading: string;
    loginRequired: string;
    loginRequiredForItem: string;
    placeholderTitle: string;
    placeholderDescription: string;
    menu: SettingsMenuCopy;
    language: {
      currentLanguage: string;
      availableLanguages: string;
      helper: string;
      selected: string;
      confirmTitle: string;
      confirmMessage: string;
    };
    privacySecurity: {
      sectionTitle: string;
      sectionDescription: string;
      privateProfileTitle: string;
      privateProfileDescription: string;
      locationTitle: string;
      locationDescription: string;
      toggleOnLabel: string;
      toggleOffLabel: string;
    };
  };
};

const messagesByLocale: Record<AppLocale, AppMessages> = {
  ko: {
    common: { confirm: "확인", cancel: "취소" },
    header: {
      login: "로그인",
      register: "회원가입",
      logout: "로그아웃",
      profileAlt: "프로필 이미지",
    },
    sidebar: {
      title: "커뮤니티 메뉴",
      profile: "프로필",
      neighbors: "동네친구",
      message: "메시지",
      notification: "알림",
      support: "고객센터",
      setting: "설정",
      shop: "상점",
      writePost: "게시글 쓰기",
      writingPost: "게시글 작성 중",
      loginRequiredMessage:
        "해당 서비스는 로그인 이후 사용할 수 있습니다.<br/>로그인 후 다시 시도해 주세요.",
    },
    settings: {
      heading: "설정",
      description: "필요한 항목을 선택하면 각 설정 페이지로 이동합니다.",
      menuAriaLabel: "설정 메뉴",
      detailKicker: "DETAIL",
      backToList: "설정 목록으로",
      loading: "로그인 정보를 확인하는 중입니다.",
      loginRequired: "설정 페이지는 로그인 후 이용할 수 있습니다.",
      loginRequiredForItem: "로그인 후 {title} 설정을 이용할 수 있습니다.",
      placeholderTitle: "연결 준비 완료",
      placeholderDescription:
        "이 페이지는 연결만 완료된 상태입니다. 이제 실제 설정 입력 UI나 API를 이어 붙이면 됩니다.",
      menu: {
        "blocked-users": {
          title: "팔로우 차단 유저",
          description: "차단한 유저와 팔로워 관련 설정을 확인합니다.",
        },
        "report-status": {
          title: "신고 및 현황",
          description: "내 신고 내역과 처리 현황을 확인합니다.",
        },
        "privacy-security": {
          title: "개인 및 보안",
          description: "프로필 공개 범위와 현재 위치 공개 여부를 관리합니다.",
        },
        "location-distance": {
          title: "지역 및 거리",
          description: "동네 범위와 거리 기준을 조정합니다.",
        },
        language: {
          title: "언어",
          description: "서비스에서 사용할 언어를 선택합니다.",
        },
        "notifications-theme": {
          title: "푸시 알림 및 배경",
          description: "알림 수신과 화면 배경 옵션을 관리합니다.",
        },
        "delete-account": {
          title: "회원 탈퇴",
          description: "계정 삭제 전 안내 사항을 확인합니다.",
        },
      },
      language: {
        currentLanguage: "현재 선택된 언어",
        availableLanguages: "지원 언어",
        helper:
          "언어를 변경하면 사이드 메뉴, 설정, 로그인/로그아웃 같은 공통 UI 문구만 바뀝니다. 게시글과 댓글 내용은 변경되지 않습니다.",
        selected: "현재 사용 중",
        confirmTitle: "언어 변경",
        confirmMessage: "{language}로 언어를 변경하시겠습니까?",
      },
      privacySecurity: {
        sectionTitle: "공개 및 보안 설정",
        sectionDescription:
          "프로필 노출 범위와 위치 공개 여부를 직접 관리할 수 있습니다.",
        privateProfileTitle: "내 프로필 비공개",
        privateProfileDescription:
          "활성화하면 다른 사용자가 내 프로필과 활동을 제한적으로 볼 수 있습니다.",
        locationTitle: "현재 위치 공개",
        locationDescription:
          "활성화하면 내 주변 위치 기반 정보에 현재 위치를 반영합니다.",
        toggleOnLabel: "ON",
        toggleOffLabel: "OFF",
      },
    },
  },
  en: {
    common: { confirm: "OK", cancel: "Cancel" },
    header: {
      login: "Login",
      register: "Sign Up",
      logout: "Logout",
      profileAlt: "Profile image",
    },
    sidebar: {
      title: "Community Menu",
      profile: "Profile",
      neighbors: "Neighbors",
      message: "Messages",
      notification: "Notifications",
      support: "Support",
      setting: "Settings",
      shop: "Shop",
      writePost: "Write Post",
      writingPost: "Writing Post",
      loginRequiredMessage:
        "This service is available after login.<br/>Please sign in and try again.",
    },
    settings: {
      heading: "Settings",
      description: "Select an item to move to its settings page.",
      menuAriaLabel: "Settings menu",
      detailKicker: "DETAIL",
      backToList: "Back to settings",
      loading: "Checking your login information.",
      loginRequired: "Settings are available after login.",
      loginRequiredForItem: "You can use the {title} settings after login.",
      placeholderTitle: "Connection ready",
      placeholderDescription:
        "This page is wired up. You can connect the real settings form or API next.",
      menu: {
        "blocked-users": {
          title: "Blocked Users",
          description: "Review blocked users and follower-related settings.",
        },
        "report-status": {
          title: "Reports & Status",
          description: "Review your reports and their current processing status.",
        },
        "privacy-security": {
          title: "Privacy & Security",
          description:
            "Manage profile visibility and whether your current location is shown.",
        },
        "location-distance": {
          title: "Location & Distance",
          description: "Adjust neighborhood range and distance preferences.",
        },
        language: {
          title: "Language",
          description: "Choose the language used across the service.",
        },
        "notifications-theme": {
          title: "Notifications & Theme",
          description: "Manage notification delivery and screen background options.",
        },
        "delete-account": {
          title: "Delete Account",
          description: "Review what happens before deleting your account.",
        },
      },
      language: {
        currentLanguage: "Current language",
        availableLanguages: "Supported languages",
        helper:
          "Changing the language updates common UI text like the sidebar, settings, and login/logout labels. Posts and comments stay as written.",
        selected: "In use",
        confirmTitle: "Change language",
        confirmMessage: "Switch the interface language to {language}?",
      },
      privacySecurity: {
        sectionTitle: "Privacy controls",
        sectionDescription:
          "Choose how visible your profile and current location should be.",
        privateProfileTitle: "Private profile",
        privateProfileDescription:
          "When enabled, other users see a more limited version of your profile and activity.",
        locationTitle: "Show current location",
        locationDescription:
          "When enabled, location-based features can reflect your current area.",
        toggleOnLabel: "ON",
        toggleOffLabel: "OFF",
      },
    },
  },
  ja: {
    common: { confirm: "確認", cancel: "キャンセル" },
    header: {
      login: "ログイン",
      register: "会員登録",
      logout: "ログアウト",
      profileAlt: "プロフィール画像",
    },
    sidebar: {
      title: "コミュニティメニュー",
      profile: "プロフィール",
      neighbors: "近所の友だち",
      message: "メッセージ",
      notification: "通知",
      support: "サポート",
      setting: "設定",
      shop: "ショップ",
      writePost: "投稿する",
      writingPost: "投稿作成中",
      loginRequiredMessage:
        "このサービスはログイン後に利用できます。<br/>ログインしてからもう一度お試しください。",
    },
    settings: {
      heading: "設定",
      description: "項目を選択すると各設定ページへ移動します。",
      menuAriaLabel: "設定メニュー",
      detailKicker: "DETAIL",
      backToList: "設定一覧へ",
      loading: "ログイン情報を確認しています。",
      loginRequired: "設定ページはログイン後に利用できます。",
      loginRequiredForItem: "{title}設定はログイン後に利用できます。",
      placeholderTitle: "接続準備完了",
      placeholderDescription:
        "このページは接続だけ完了しています。必要に応じて設定UIやAPIを追加してください。",
      menu: {
        "blocked-users": {
          title: "ブロックしたユーザー",
          description: "ブロックしたユーザーやフォロー関連設定を確認します。",
        },
        "report-status": {
          title: "通報と状況",
          description: "自分の通報履歴と処理状況を確認します。",
        },
        "privacy-security": {
          title: "個人情報とセキュリティ",
          description: "プロフィール公開範囲と現在地の公開可否を管理します。",
        },
        "location-distance": {
          title: "地域と距離",
          description: "近所の範囲と距離基準を調整します。",
        },
        language: {
          title: "言語",
          description: "サービスで使用する言語を選択します。",
        },
        "notifications-theme": {
          title: "通知と背景",
          description: "通知受信と画面背景の設定を管理します。",
        },
        "delete-account": {
          title: "退会",
          description: "アカウント削除前の案内を確認します。",
        },
      },
      language: {
        currentLanguage: "現在の言語",
        availableLanguages: "対応言語",
        helper:
          "言語を変更すると、サイドメニューや設定、ログイン/ログアウトなどの共通UI文言のみ変わります。投稿とコメントの内容は変わりません。",
        selected: "使用中",
        confirmTitle: "言語変更",
        confirmMessage: "表示言語を{language}に変更しますか？",
      },
      privacySecurity: {
        sectionTitle: "公開とセキュリティ設定",
        sectionDescription:
          "プロフィールの公開範囲と位置情報の公開可否をここで調整できます。",
        privateProfileTitle: "プロフィールを非公開にする",
        privateProfileDescription:
          "有効にすると、他のユーザーが見られるプロフィールと活動内容が制限されます。",
        locationTitle: "現在地を公開する",
        locationDescription:
          "有効にすると、周辺ベースの機能に現在地が反映されます。",
        toggleOnLabel: "ON",
        toggleOffLabel: "OFF",
      },
    },
  },
  "zh-CN": {
    common: { confirm: "确认", cancel: "取消" },
    header: {
      login: "登录",
      register: "注册",
      logout: "退出登录",
      profileAlt: "个人头像",
    },
    sidebar: {
      title: "社区菜单",
      profile: "个人资料",
      neighbors: "邻居朋友",
      message: "消息",
      notification: "通知",
      support: "客服中心",
      setting: "设置",
      shop: "商店",
      writePost: "写帖子",
      writingPost: "正在发帖",
      loginRequiredMessage:
        "该服务需要登录后才能使用。<br/>请先登录后再试。",
    },
    settings: {
      heading: "设置",
      description: "选择项目后即可进入对应的设置页面。",
      menuAriaLabel: "设置菜单",
      detailKicker: "DETAIL",
      backToList: "返回设置列表",
      loading: "正在检查登录状态。",
      loginRequired: "设置页面需要登录后才能使用。",
      loginRequiredForItem: "登录后即可使用{title}设置。",
      placeholderTitle: "连接已准备好",
      placeholderDescription:
        "此页面已完成连接，接下来可以继续接入实际设置 UI 或 API。",
      menu: {
        "blocked-users": {
          title: "已屏蔽用户",
          description: "查看已屏蔽用户和关注相关设置。",
        },
        "report-status": {
          title: "举报与状态",
          description: "查看我的举报记录和当前处理状态。",
        },
        "privacy-security": {
          title: "隐私与安全",
          description: "管理个人资料公开范围和当前位置公开状态。",
        },
        "location-distance": {
          title: "位置与距离",
          description: "调整邻里范围和距离条件。",
        },
        language: {
          title: "语言",
          description: "选择整个服务使用的语言。",
        },
        "notifications-theme": {
          title: "通知与背景",
          description: "管理通知接收和界面背景选项。",
        },
        "delete-account": {
          title: "删除账号",
          description: "查看删除账号前的说明。",
        },
      },
      language: {
        currentLanguage: "当前语言",
        availableLanguages: "支持的语言",
        helper:
          "更改语言后，只会更新侧边菜单、设置、登录/退出登录等公共 UI 文案，帖子和评论内容不会变化。",
        selected: "使用中",
        confirmTitle: "更改语言",
        confirmMessage: "要将界面语言切换为{language}吗？",
      },
      privacySecurity: {
        sectionTitle: "公开与安全设置",
        sectionDescription:
          "你可以在这里直接控制个人资料和位置信息的公开范围。",
        privateProfileTitle: "将我的资料设为私密",
        privateProfileDescription:
          "开启后，其他用户只能看到受限制的个人资料和活动信息。",
        locationTitle: "公开当前位置",
        locationDescription:
          "开启后，基于位置的功能会反映你当前所在区域。",
        toggleOnLabel: "ON",
        toggleOffLabel: "OFF",
      },
    },
  },
};

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return supportedLocales.includes(value as AppLocale);
}

export function getMessages(locale: AppLocale): AppMessages {
  return messagesByLocale[locale] ?? messagesByLocale[defaultLocale];
}

export function formatMessage(
  template: string,
  variables: Record<string, string>,
) {
  return Object.entries(variables).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, value),
    template,
  );
}
