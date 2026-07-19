"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import CommunitySidebar from "@/app/components/community/CommunitySidebar";
import showSwal from "@/app/components/modal/Swal";
import { useAuth } from "@/app/providers/AuthProvider";
import { toProfileImageUrl } from "@/app/utils/imageUrl";
import memberApi from "@/service/api";
import "@/app/styles/mypage.css";

const NICKNAME_MAX_LENGTH = 18;

type MeResponse = {
  memberIdx: number;
  name: string;
  nickName?: string;
  bio?: string;
  imageFilesId?: string[];
  thumbnailProfileImagePath?: string;
};

export default function MyPageEditClient() {
  const router = useRouter();
  const { user, loading, refreshUser } = useAuth();
  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [name, setName] = useState("");
  const [nickName, setNickName] = useState("");
  const [bio, setBio] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchMe = async () => {
      try {
        setIsLoading(true);
        const res = await memberApi.me();
        const nextProfile = (res.data?.response ?? null) as MeResponse | null;
        setProfile(nextProfile);
        setName(nextProfile?.name ?? "");
        setNickName(nextProfile?.nickName ?? "");
        setBio(nextProfile?.bio ?? "");
        setSelectedImage(null);
        setSelectedImagePreview(nextProfile?.thumbnailProfileImagePath ?? "");
      } catch (error) {
        console.error("프로필 편집 정보 조회 실패:", error);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchMe();
  }, [loading, user]);

  useEffect(() => {
    return () => {
      if (selectedImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    };
  }, [selectedImagePreview]);

  const onSelectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (selectedImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(selectedImagePreview);
    }

    setSelectedImage(file);
    setSelectedImagePreview(URL.createObjectURL(file));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile || isSubmitting) return;

    const trimmedNickName = nickName.trim();
    if (trimmedNickName.length > NICKNAME_MAX_LENGTH) {
      await showSwal("error", `닉네임은 최대 ${NICKNAME_MAX_LENGTH}자까지 입력할 수 있습니다.`);
      return;
    }

    const formData = new FormData();
    formData.append(
      "dto",
      new Blob(
        [
          JSON.stringify({
            name: name.trim(),
            nickName: trimmedNickName,
            bio: bio.trim(),
            imageFileId: selectedImage ? [] : (profile.imageFilesId ?? []),
          }),
        ],
        { type: "application/json" },
      ),
    );
    if (selectedImage) {
      formData.append("files", selectedImage);
    }

    try {
      setIsSubmitting(true);
      await memberApi.updateMember(profile.memberIdx, formData);
      await refreshUser();
      await showSwal("success", "프로필을 수정했습니다.");
      router.push("/mypage");
    } catch (error) {
      console.error("프로필 수정 실패:", error);
      await showSwal("error", "프로필 수정에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="main-page">
      <CommunitySidebar activeMenuKey="profile" />

      <div className="feed-area">
        <section className="mypage-shell">
          {loading || isLoading ? (
            <p className="mypage-empty">편집 정보를 불러오는 중입니다.</p>
          ) : !user || !profile ? (
            <p className="mypage-empty">로그인해야 프로필을 수정할 수 있습니다.</p>
          ) : (
            <form className="mypage-edit-form" onSubmit={onSubmit}>
              <div className="mypage-edit-head">
                <div>
                  <h1>프로필 편집</h1>
                  <p>{profile.name}님의 표시 정보를 수정합니다.</p>
                </div>
                <button
                  type="button"
                  className="mypage-edit-cancel"
                  onClick={() => router.push("/mypage")}
                >
                  취소
                </button>
              </div>

              <label className="mypage-edit-field">
                <span>이름</span>
                <input value={name} onChange={(event) => setName(event.target.value)} maxLength={30} />
              </label>

              <label className="mypage-edit-field">
                <span>닉네임</span>
                <input
                  value={nickName}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    if (nextValue.length > NICKNAME_MAX_LENGTH) {
                      void showSwal(
                        "error",
                        `닉네임은 최대 ${NICKNAME_MAX_LENGTH}자까지 입력할 수 있습니다.`,
                      );
                      return;
                    }
                    setNickName(nextValue);
                  }}
                  maxLength={NICKNAME_MAX_LENGTH}
                />
              </label>

              <label className="mypage-edit-field">
                <span>프로필 이미지</span>
                {selectedImagePreview ? (
                  <img
                    src={toProfileImageUrl(selectedImagePreview)}
                    alt="프로필 미리보기"
                    className="mypage-edit-preview-image"
                  />
                ) : null}
                <input type="file" accept="image/*" onChange={onSelectImage} />
              </label>

              <label className="mypage-edit-field">
                <span>한 줄 소개</span>
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  rows={4}
                  maxLength={120}
                />
              </label>

              <button type="submit" className="mypage-save-btn" disabled={isSubmitting}>
                {isSubmitting ? "저장 중.." : "저장하기"}
              </button>
            </form>
          )}
        </section>
      </div>
    </section>
  );
}
