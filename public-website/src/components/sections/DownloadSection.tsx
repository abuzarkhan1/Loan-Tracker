import { Download, Smartphone } from "lucide-react";
import { APP_CONFIG } from "../../config/app.config";
import { ButtonLink } from "../common/ButtonLink";
import { Card } from "../common/Card";
import { Section } from "../common/Section";
import { SectionHeader } from "../common/SectionHeader";

const details = [
  ["Version", APP_CONFIG.apkVersion],
  ["APK size", APP_CONFIG.apkSize],
  ["Last updated", APP_CONFIG.lastUpdated],
  ["Compatibility", APP_CONFIG.androidCompatibility],
];

export const DownloadSection = ({ full = false }: { full?: boolean }) => (
  <Section id="download">
    <div className="grid items-center gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <SectionHeader
        align="left"
        eyebrow="Download APK"
        title="Install Loan Tracker on Android and keep every loan clear."
        description="The APK link is intentionally centralized in one config file, so you can update the final build URL when your Expo Android build is ready."
      />

      <Card className="rounded-2xl p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid size-16 place-items-center rounded-[20px] bg-peach text-primary">
              <Smartphone size={28} />
            </span>
            <div>
              <h3 className="text-2xl font-extrabold text-dark">{APP_CONFIG.appName} APK</h3>
              <p className="mt-1 text-sm font-bold text-muted">Android app download</p>
            </div>
          </div>
          <ButtonLink href={APP_CONFIG.apkDownloadUrl} icon={Download} size="lg">
            Download Android APK
          </ButtonLink>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {details.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border bg-background-soft p-4">
              <p className="text-xs font-extrabold uppercase text-muted">{label}</p>
              <p className="mt-1 text-base font-extrabold text-dark">{value}</p>
            </div>
          ))}
        </div>

        {full ? (
          <div className="mt-7 rounded-xl border border-border bg-card p-5">
            <h4 className="text-lg font-extrabold text-dark">Installation guide</h4>
            <ol className="mt-4 grid gap-3 text-sm font-bold leading-7 text-muted">
              <li>1. Download the APK from the button above.</li>
              <li>2. Open the downloaded file on your Android phone.</li>
              <li>3. Allow installation from your browser if Android asks for permission.</li>
              <li>4. Open Loan Tracker and sign in or create your account.</li>
            </ol>
          </div>
        ) : null}
      </Card>
    </div>
  </Section>
);
