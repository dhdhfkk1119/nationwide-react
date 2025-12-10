import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    rules: {
      // ----- 기본 추천 설정 -----

      // console.log 허용
      "no-console": "off",

      // 사용 안 하는 변수 경고만 (오류 X)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // React 19는 자동 import라서 필요 없음
      "react/react-in-jsx-scope": "off",

      // prettier 없으면 아래로 기본 스타일 강제
      semi: ["warn", "always"],
      quotes: ["warn", "double"],

      // import 정리 경고
      "sort-imports": [
        "warn",
        {
          ignoreDeclarationSort: false,
          ignoreMemberSort: false,
        },
      ],
    },
  },

  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
