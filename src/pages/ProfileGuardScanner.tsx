import React, { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Shield, Users, ArrowUp, ArrowDown, Check, X, Lock } from "lucide-react";

const MOCK_PROFILE_PUBLIC = {
  picture: "https://randomuser.me/api/portraits/women/85.jpg",
  username: "girl_88_293",
  followers: 14,
  posts: 0,
  bio: "DM me for fun! 😘🔥",
  private: false,
};

const MOCK_PROFILE_PRIVATE = {
  picture: "https://randomuser.me/api/portraits/women/86.jpg",
  username: "private_user123",
  followers: null,
  posts: null,
  bio: "",
  private: true,
};

type ScanResult = {
  threatScore: number;
  verdict: "Real" | "Suspicious" | "Likely Fake";
  confidence: number; // as percent
  explanation: string;
};

type QuestionnaireAnswers = {
  userKnowsThem: "yes" | "no";
  hasWeirdMessages: "yes" | "no";
  profilePicFeelsFake: "yes" | "no";
  requestsSensitiveInfo: "yes" | "no";
  seemsToTargetWomen: "yes" | "no";
};

const QUESTIONNAIRE = [
  {
    key: "userKnowsThem",
    question: "Do you know this person in real life?",
    options: [
      {label: "Yes", value: "yes"},
      {label: "No or Unsure", value: "no"},
    ],
  },
  {
    key: "profilePicFeelsFake",
    question: "Does the profile photo seem AI-generated or 'too perfect'?",
    options: [
      {label: "No", value: "no"},
      {label: "Yes, looks fake or inconsistent", value: "yes"},
    ],
  },
  {
    key: "hasWeirdMessages",
    question: "Did this profile send you odd DMs, links, or quickly ask for romance/favors?",
    options: [
      {label: "No", value: "no"},
      {label: "Yes, I received odd/unusual messages", value: "yes"},
    ],
  },
  {
    key: "requestsSensitiveInfo",
    question: "Did they request private/sensitive info (photos, money, number)?",
    options: [
      {label: "No", value: "no"},
      {label: "Yes", value: "yes"},
    ],
  },
  {
    key: "seemsToTargetWomen",
    question: "Does the account seem to frequently interact with or follow mainly women?",
    options: [
      {label: "Not sure", value: "no"},
      {label: "Yes", value: "yes"},
    ],
  }
];

// Detection logic for public profile:
const analyzeProfile = (profile: typeof MOCK_PROFILE_PUBLIC): ScanResult => {
  let fakePoints = 0;
  let explanation = "";

  // 1. Image Verification (Stub - always synthetic for demo)
  const isDeepfake = true; // replace with backend check later
  if (isDeepfake) {
    fakePoints += 2;
    explanation += "Profile photo detected as AI-generated. ";
  }

  // 2. Heuristics
  if (typeof profile.followers === "number" && profile.followers < 20) {
    fakePoints += 1;
    explanation += "Very few followers. ";
  }
  if (typeof profile.posts === "number" && profile.posts < 2) {
    fakePoints += 1;
    explanation += "Very few posts. ";
  }
  if (!profile.bio || /dm me|😘|🔥|^(\W+)$/.test(profile.bio.toLowerCase())) {
    fakePoints += 1;
    explanation += "Bio is empty or suspicious. ";
  }
  if (/_|\d/.test(profile.username)) {
    fakePoints += 1;
    explanation += "Username contains suspicious patterns. ";
  }

  let verdict: ScanResult["verdict"] = "Real";
  if (fakePoints >= 4) verdict = "Likely Fake";
  else if (fakePoints >= 2) verdict = "Suspicious";
  
  const confidence = 60 + fakePoints * 8;

  return {
    threatScore: Math.min(fakePoints, 5),
    verdict,
    confidence: Math.min(confidence, 99),
    explanation: explanation || "No major red flags detected.",
  };
};

// Questionnaire-based analysis for private accounts:
const analyzePrivateQuestionnaire = (answers: QuestionnaireAnswers): ScanResult => {
  let fakePoints = 0;
  let explanation = "";

  if (answers.userKnowsThem === "no") {
    fakePoints += 1;
    explanation += "You don't know this person in real life. ";
  }
  if (answers.profilePicFeelsFake === "yes") {
    fakePoints += 2;
    explanation += "Profile photo seems AI-generated. ";
  }
  if (answers.hasWeirdMessages === "yes") {
    fakePoints += 1;
    explanation += "Received odd or manipulative DMs. ";
  }
  if (answers.requestsSensitiveInfo === "yes") {
    fakePoints += 2;
    explanation += "Requested private/sensitive info which is a major red flag. ";
  }
  if (answers.seemsToTargetWomen === "yes") {
    fakePoints += 1;
    explanation += "Profile seems to target mainly women. ";
  }

  let verdict: ScanResult["verdict"] = "Real";
  if (fakePoints >= 4) verdict = "Likely Fake";
  else if (fakePoints >= 2) verdict = "Suspicious";
  const confidence = 60 + fakePoints * 8;

  return {
    threatScore: Math.min(fakePoints, 5),
    verdict,
    confidence: Math.min(confidence, 99),
    explanation: explanation || "No major red flags detected.",
  };
};

const ProfileGuardScanner: React.FC = () => {
  const [input, setInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [profile, setProfile] = useState<typeof MOCK_PROFILE_PUBLIC | typeof MOCK_PROFILE_PRIVATE | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  // Private account flow
  const [isPrivate, setIsPrivate] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [answers, setAnswers] = useState<Partial<QuestionnaireAnswers>>({});
  const [questionIdx, setQuestionIdx] = useState(0);
  const [privateProfilePic, setPrivateProfilePic] = useState<string | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    // CLEAR all scan info BEFORE showing loading indicator
    setProfile(null);
    setResult(null);
    setShowQuestionnaire(false);
    setIsPrivate(false);
    setAnswers({});
    setQuestionIdx(0);
    setPrivateProfilePic(null);

    // setScanning set AFTER resetting, so UI clears *immediately*
    setScanning(true);

    // For DEMO: If input contains "private", treat as private profile.
    const lowerInput = input.toLowerCase();
    const isPrivateProfile = lowerInput.includes("private");
    setTimeout(() => {
      if (isPrivateProfile) {
        setProfile(MOCK_PROFILE_PRIVATE);
        setIsPrivate(true);
        setPrivateProfilePic(MOCK_PROFILE_PRIVATE.picture);
        setShowQuestionnaire(true);
      } else {
        setProfile(MOCK_PROFILE_PUBLIC);
        setResult(analyzeProfile(MOCK_PROFILE_PUBLIC));
        setIsPrivate(false);
        setShowQuestionnaire(false);
      }
      setScanning(false);
      setQuestionIdx(0);
      setAnswers({});
    }, 1200);
  };

  const handleAnswer = (val: string) => {
    const q = QUESTIONNAIRE[questionIdx];
    setAnswers({
      ...answers,
      [q.key]: val
    });
    if (questionIdx < QUESTIONNAIRE.length - 1) {
      setQuestionIdx(questionIdx + 1);
    } else {
      // Finish & analyze
      const finalAnswers = { ...answers, [q.key]: val } as QuestionnaireAnswers;
      setShowQuestionnaire(false);
      setResult(analyzePrivateQuestionnaire(finalAnswers));
    }
  };

  const handleReset = () => {
    setInput(""); // Clear the input box synchronously
    setProfile(null);
    setResult(null);
    setIsPrivate(false);
    setShowQuestionnaire(false);
    setAnswers({});
    setQuestionIdx(0);
    setPrivateProfilePic(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-veritas-lightPurple to-white">
      <Navigation />
      <main className="flex-grow flex flex-col items-center px-2">
        <div className="w-full max-w-xl mt-12 mb-10">
          <Card className="shadow-lg border-veritas-purple/30">
            <CardHeader>
              <div className="flex items-center justify-center mb-2">
                <Shield className="h-8 w-8 text-veritas-purple mr-2" />
                <CardTitle className="text-veritas-purple text-2xl text-center">Profile Guard Scanner</CardTitle>
              </div>
              <p className="text-center text-gray-600 text-sm">
                Enter the <b>profile URL or username</b> below (Instagram, Bumble, Tinder, etc).
                <br />Our AI will scan for signs of fakes or scams. Private accounts get a custom assessment.
              </p>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col gap-4" onSubmit={handleScan}>
                <Input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="e.g. instagram.com/girl_88_293 or girl_88_293"
                  className="bg-veritas-lightPurple/50 border-veritas-purple"
                  required
                  disabled={scanning}
                />
                <Button 
                  type="submit" 
                  className="mt-2 bg-veritas-purple hover:bg-veritas-darkPurple"
                  disabled={scanning || !input}>
                  {scanning ? "Scanning..." : "Scan Profile"}
                </Button>
                {(profile || result) && !scanning && (
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full mt-1"
                    onClick={handleReset}
                    disabled={scanning}
                  >
                    Start New Scan
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Render nothing (not questionnaire, not result, not profile) if scanning is in progress */}
        {!scanning && (
          <>
            {/* Questionnaire Modal */}
            {showQuestionnaire && (
              <Card className="w-full max-w-md mx-auto shadow-lg border-purple-200 mb-8 animate-in fade-in">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-6 w-6 text-veritas-purple" />
                    <CardTitle className="text-veritas-purple text-lg">Private Account Detected</CardTitle>
                  </div>
                  <p className="text-gray-700 text-sm">
                    Since this account is private, we'll ask you a few quick questions to assess possible risks.
                  </p>
                  <div className="flex justify-center mt-2">
                    {privateProfilePic && (
                      <img
                        src={privateProfilePic}
                        alt="Profile"
                        className="w-20 h-20 rounded-full border-4 border-veritas-purple shadow"
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div>
                    <div className="font-medium mb-5 text-veritas-purple">
                      {QUESTIONNAIRE[questionIdx].question}
                    </div>
                    <div className="flex flex-col gap-2">
                      {QUESTIONNAIRE[questionIdx].options.map(opt => (
                        <Button
                          key={opt.value}
                          className="w-full text-base py-2"
                          variant="outline"
                          onClick={() => handleAnswer(opt.value)}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Result & Analysis */}
            {profile && result && (
              <div className="w-full max-w-2xl flex flex-col md:flex-row gap-6">
                {/* Public or Private Data Card */}
                <Card className="flex-1 px-0 shadow-md border-veritas-purple/20">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="h-6 w-6 text-veritas-purple" />
                      <CardTitle className="text-veritas-purple text-xl">
                        {isPrivate ? "Profile Data (Limited)" : "Extracted Public Data"}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 flex-wrap">
                      <img
                        src={profile.picture}
                        alt="Profile"
                        className="w-24 h-24 rounded-full border-4 border-veritas-purple shadow"
                      />
                      <div>
                        <div className="font-semibold">@{profile.username}</div>
                        {!isPrivate && (
                          <>
                            <div className="text-gray-700 text-sm">Followers: <b>{profile.followers}</b></div>
                            <div className="text-gray-700 text-sm">Posts: <b>{profile.posts}</b></div>
                            <div className="text-gray-700 text-sm break-all">
                              Bio: <span className="italic">{profile.bio}</span>
                            </div>
                          </>
                        )}
                        {isPrivate && (
                          <div className="text-gray-600 text-sm mt-1">
                            This account is <b>private</b>. Most details are hidden.<br />
                            Results are based on your answers.
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Result Panel */}
                <Card className="flex-1 shadow-lg border-veritas-purple/30 flex flex-col justify-between">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="h-6 w-6" color={
                        result.verdict === "Real"
                          ? "#059669"
                          : result.verdict === "Suspicious"
                            ? "#f59e42"
                            : "#dc2626"
                      }/>
                      <CardTitle className={`text-xl ${
                        result.verdict === "Real" ? "text-green-700" : result.verdict === "Suspicious"
                          ? "text-yellow-700" : "text-red-700"
                      }`}>
                        Result
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="font-semibold text-md mb-2">
                      Threat Score:{" "}
                      <span className="inline-flex items-center gap-1">
                        {result.threatScore}
                        {result.threatScore < 2 && <Check className="text-green-700 h-5 w-5" />}
                        {result.threatScore === 2 || result.threatScore === 3
                          ? <ArrowUp className="text-yellow-600 h-5 w-5" />
                          : null
                        }
                        {result.threatScore >= 4 && <X className="text-red-600 h-5 w-5" />}
                      </span>
                      <span className="text-xs ml-1 text-gray-500">(0 = safe, 5 = high risk)</span>
                    </div>
                    <div className="mb-1">
                      Verdict: <b className={
                        result.verdict === "Real"
                          ? "text-green-700"
                          : result.verdict === "Suspicious"
                            ? "text-yellow-800"
                            : "text-red-700"
                      }>
                        {result.verdict}
                      </b>
                    </div>
                    <div className="mb-1">
                      Confidence: <b>{result.confidence}%</b>
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                      <b>Why?</b> {result.explanation}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        {/* Tips or FAQ */}
        <div className="max-w-2xl mx-auto mt-8 text-sm text-gray-500 text-center">
          <div className="mb-2">
            <span className="font-medium text-veritas-purple">Note:</span> This tool uses a combination of AI and rule-based models to detect fake profiles. Results may not be 100% accurate—always use your own judgment.
          </div>
          <div>
            Currently supports <span className="font-semibold">Instagram, Bumble, Tinder</span> and similar social networks.
            <br />
            <span>Backend logic and real verification (image/model/API checks) coming soon!</span>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfileGuardScanner;
