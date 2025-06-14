import React, { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Shield, Users, ArrowUp, ArrowDown, Check, X, Lock, Upload, Image as ImageIcon, AlertCircle
} from "lucide-react";

// === Types ===
type ScanResult = {
  threatScore: number;
  verdict: "Real" | "Suspicious" | "Likely Fake";
  confidence: number; // percent
  explanation: string;
};

type PublicProfileData = {
  picture: string;
  username: string;
  followers: number | null;
  posts: number | null;
  bio: string;
  private: boolean;
};

type PrivateProfileData = {
  picture: string;
  username: string;
  private: true;
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

// === Algorithms ===

// Fake check for public profiles: Returns demo result
function analyzePublicProfile(profile: PublicProfileData): ScanResult {
  let points = 0;
  let explanation = "";

  // DEMO: Photo AI-check stub, pretend it's random
  if (profile.picture && profile.picture.includes("randomuser")) {
    points += 1;
    explanation += "Profile photo could be AI-generated. ";
  }

  if (profile.followers !== null && profile.followers < 20) {
    points += 1;
    explanation += "Few followers. ";
  }

  if (profile.posts !== null && profile.posts < 2) {
    points += 1;
    explanation += "Few posts. ";
  }

  if (!profile.bio || /dm me|😘|🔥|friend/i.test(profile.bio)) {
    points += 1;
    explanation += "Bio is empty or may be baiting contact. ";
  }

  if (/_|\d/.test(profile.username)) {
    points += 1;
    explanation += "Username has suspicious patterns. ";
  }

  let verdict: ScanResult["verdict"] = "Real";
  if (points >= 4) verdict = "Likely Fake";
  else if (points >= 2) verdict = "Suspicious";

  return {
    threatScore: Math.min(points, 5),
    verdict,
    confidence: Math.min(60 + points * 8, 99),
    explanation: explanation || "No major red flags detected."
  };
}

// Private profile questionnaire-based score
function analyzePrivateAnswers(answers: QuestionnaireAnswers): ScanResult {
  let points = 0;
  let explanation = "";

  if (answers.userKnowsThem === "no") {
    points += 1;
    explanation += "You don't know this person. ";
  }
  if (answers.profilePicFeelsFake === "yes") {
    points += 2;
    explanation += "Profile photo seems fake. ";
  }
  if (answers.hasWeirdMessages === "yes") {
    points += 1;
    explanation += "Received odd/unusual messages. ";
  }
  if (answers.requestsSensitiveInfo === "yes") {
    points += 2;
    explanation += "Requested sensitive info (major warning). ";
  }
  if (answers.seemsToTargetWomen === "yes") {
    points += 1;
    explanation += "Appears to target mainly women. ";
  }

  let verdict: ScanResult["verdict"] = "Real";
  if (points >= 4) verdict = "Likely Fake";
  else if (points >= 2) verdict = "Suspicious";
  return {
    threatScore: Math.min(points, 5),
    verdict,
    confidence: Math.min(60 + points * 8, 99),
    explanation: explanation || "No major red flags detected."
  };
}

// === Main Component ===
const ProfileGuardScanner: React.FC = () => {
  const [input, setInput] = useState("");
  const [scanning, setScanning] = useState(false);

  // Profile/result data (overwrite on every scan)
  const [profile, setProfile] = useState<PublicProfileData | PrivateProfileData | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  // Private flow state
  const [isPrivate, setIsPrivate] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [answers, setAnswers] = useState<Partial<QuestionnaireAnswers>>({});
  const [questionIdx, setQuestionIdx] = useState(0);

  // For private-profiles: let user upload a photo (simulate)
  const [privateProfilePic, setPrivateProfilePic] = useState<string | null>(null);

  // Image checker state (unchanged)
  const [showImageChecker, setShowImageChecker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [imgRisk, setImgRisk] = useState<null | "low" | "medium" | "high">(null);
  const [imgResultMsg, setImgResultMsg] = useState<string | null>(null);
  const [imgProgress, setImgProgress] = useState(0);

  const resetAll = () => {
    setScanning(false);
    setProfile(null);
    setResult(null);
    setIsPrivate(false);
    setShowQuestionnaire(false);
    setAnswers({});
    setQuestionIdx(0);
    setPrivateProfilePic(null);
    setShowImageChecker(false);
    setSelectedImage(null);
    setPreviewUrl(null);
    setAnalyzingImage(false);
    setImgRisk(null);
    setImgResultMsg(null);
    setImgProgress(0);
  };

  useEffect(() => {
    resetAll();
  }, [input]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    resetAll();
    setScanning(true);

    const userInput = input.trim();

    // Check if profile is "private" by pattern match
    const privatePattern = /private|locked|restricted/i;
    const isPrivateInput = privatePattern.test(userInput);

    await new Promise(res => setTimeout(res, 1200));

    if (isPrivateInput) {
      // Strictly use what the user typed as the profile id/link
      setProfile({
        picture: "https://randomuser.me/api/portraits/women/65.jpg",
        username: userInput, // Always user input
        private: true,
      });
      setPrivateProfilePic("https://randomuser.me/api/portraits/women/65.jpg");
      setIsPrivate(true);
      setShowQuestionnaire(true);
      setResult(null);
    } else {
      // Use the exact input as the identifier (even if it's a link, show it as the username)
      // Demo: randomize only other fields, display entered link
      const nFollowers = Math.floor(Math.random() * 10000);
      const nPosts = Math.floor(Math.random() * 100);
      const demoBio = nFollowers < 20 ? "DM me for fun! 😘🔥" : "Passionate about travel, tech and art.";
      const avatarNum = Math.floor(Math.random() * 99) + 1;
      const generatedProfile: PublicProfileData = {
        picture: `https://randomuser.me/api/portraits/women/${avatarNum}.jpg`,
        username: userInput, // Always use user input
        followers: nFollowers,
        posts: nPosts,
        bio: demoBio,
        private: false,
      };
      setProfile(generatedProfile);
      setResult(analyzePublicProfile(generatedProfile));
      setIsPrivate(false);
      setShowQuestionnaire(false);
    }
    setScanning(false);
  };

  const handleAnswer = (val: string) => {
    const q = QUESTIONNAIRE[questionIdx];
    const updated = { ...answers, [q.key]: val };
    setAnswers(updated);

    if (questionIdx < QUESTIONNAIRE.length - 1) {
      setQuestionIdx(questionIdx + 1);
    } else {
      // Finalize
      setShowQuestionnaire(false);
      setResult(analyzePrivateAnswers(updated as QuestionnaireAnswers));
    }
  };

  const resetImageChecker = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setAnalyzingImage(false);
    setImgRisk(null);
    setImgResultMsg(null);
    setImgProgress(0);
  };

  const handleShowImageChecker = () => {
    resetImageChecker();
    setShowImageChecker(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if (!file.type.match("image.*")) {
      alert("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image too large (max 5MB).");
      return;
    }
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
    setImgRisk(null);
    setImgResultMsg(null);
    setImgProgress(0);
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage) return;
    setAnalyzingImage(true);
    setImgProgress(0);
    setImgRisk(null);
    setImgResultMsg(null);
    for (let p = 0; p <= 90; p += 7) {
      setImgProgress(p);
      await new Promise(r => setTimeout(r, 50));
    }
    // mock: pseudo-random based on file name and size
    const score = (selectedImage.name.length * selectedImage.size) % 100;
    let risk: "low" | "medium" | "high";
    if (score > 80) risk = "high";
    else if (score > 50) risk = "medium";
    else risk = "low";
    setImgProgress(100);
    setImgRisk(risk);

    if (risk === "low") setImgResultMsg("This image appears to be authentic.");
    else if (risk === "medium") setImgResultMsg("Some suspicious elements detected. Use caution.");
    else setImgResultMsg("Strong signs of being AI-generated or fake.");
    setAnalyzingImage(false);
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
                Enter the <b>profile URL or username</b> below (Instagram, Bumble, Tinder, etc).<br />
                Our AI will scan for signs of fakes or scams. Private accounts get a custom assessment.
              </p>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col gap-4" onSubmit={handleScan}>
                <Input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="e.g. instagram.com/your_profile"
                  className="bg-veritas-lightPurple/50 border-veritas-purple"
                  required
                  disabled={scanning}
                />
                <Button 
                  type="submit" 
                  className="mt-2 bg-veritas-purple hover:bg-veritas-darkPurple"
                  disabled={scanning || !input}
                >
                  {scanning ? "Scanning..." : "Scan Profile"}
                </Button>
                {/* Reset/Start Over */}
                {!scanning && (profile || result || input) && (
                  <Button
                    variant="ghost"
                    type="button"
                    className="w-full mt-1 text-veritas-purple"
                    onClick={resetAll}
                  >
                    Clear
                  </Button>
                )}
                {(profile || result) && !scanning && (
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full mt-1"
                    onClick={resetAll}
                    disabled={scanning}
                  >
                    Start New Scan
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Loading UI */}
        {scanning && (
          <div className="my-8 flex flex-col items-center gap-2 animate-pulse">
            <Shield className="h-12 w-12 text-veritas-purple/60 animate-spin mb-2" />
            <span className="text-veritas-purple text-xl font-medium">Scanning…</span>
            <span className="text-gray-600 text-sm">Analyzing profile and signals…</span>
          </div>
        )}

        {!scanning && (
          <>
            {/* Questionnaire for private */}
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

            {/* Profile/result display */}
            {profile && result && (
              <div className="w-full max-w-2xl flex flex-col md:flex-row gap-6">
                {/* Left: Profile card */}
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
                        {"private" in profile && profile.private ? (
                          <div className="text-gray-600 text-sm mt-1">
                            This account is <b>private</b>. Most details are hidden.<br />
                            Results are based on your answers.
                          </div>
                        ) : (
                          <>
                            <div className="text-gray-700 text-sm">
                              Followers: <b>{(profile as PublicProfileData).followers}</b>
                            </div>
                            <div className="text-gray-700 text-sm">
                              Posts: <b>{(profile as PublicProfileData).posts}</b>
                            </div>
                            <div className="text-gray-700 text-sm break-all">
                              Bio: <span className="italic">{(profile as PublicProfileData).bio}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {/* Right: Result */}
                <Card className="flex-1 shadow-lg border-veritas-purple/30 flex flex-col justify-between">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="h-6 w-6" color={
                        result.verdict === "Real"
                          ? "#059669"
                          : result.verdict === "Suspicious"
                            ? "#f59e42"
                            : "#dc2626"
                      } />
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

        {/* Try Fake Profile Photo Detector button */}
        {profile && result && !showImageChecker && (
          <Button
            variant="outline"
            type="button"
            className="mt-4 text-base"
            onClick={handleShowImageChecker}
          >
            <ImageIcon className="mr-1 h-5 w-5" />
            Try Fake Profile Photo Detector
          </Button>
        )}

        {/* Fake Image Checker */}
        {showImageChecker && (
          <Card className="w-full shadow-lg mt-2 mb-8 border-purple-200 animate-in fade-in">
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <ImageIcon className="h-6 w-6 text-veritas-purple" />
                <CardTitle className="text-veritas-purple text-lg">Profile Photo: Fake or Real?</CardTitle>
              </div>
              <p className="text-gray-700 text-sm">
                Upload a profile photo to check if it looks like a real person or an AI fake.<br />
                (Demo only – no image leaves your device)
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-6 items-start w-full">
                <div className="flex flex-col items-center">
                  <label
                    className={`flex flex-col items-center justify-center w-40 h-40 border-2 ${previewUrl ? 'border-solid border-veritas-purple/30' : 'border-dashed border-gray-300'} 
                    rounded-lg cursor-pointer ${previewUrl ? 'bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-8 w-8 text-veritas-purple mb-1" />
                        <span className="text-xs text-gray-500">PNG, JPG, or WEBP (Max 5MB)</span>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                  {selectedImage && (
                    <div className="mt-2 text-xs text-gray-600 text-center">
                      {selectedImage.name}<br />
                      {(selectedImage.size / 1024 < 1000
                        ? `${Math.round(selectedImage.size / 1024)} KB`
                        : `${(selectedImage.size / (1024 * 1024)).toFixed(2)} MB`)}
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-3 flex-wrap mt-2">
                    <Button
                      type="button"
                      className="bg-veritas-purple hover:bg-veritas-darkPurple"
                      size="sm"
                      onClick={handleAnalyzeImage}
                      disabled={!selectedImage || analyzingImage}
                    >
                      {analyzingImage ? (
                        <>
                          <Shield className="h-4 w-4 animate-spin mr-2" />
                          Analyzing…
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          {imgRisk || imgResultMsg ? "Analyze Again" : "Analyze"}
                        </>
                      )}
                    </Button>
                    {(selectedImage || imgResultMsg) && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-veritas-purple"
                        size="sm"
                        onClick={resetImageChecker}
                        disabled={analyzingImage}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  {analyzingImage && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span>Analyzing...</span>
                        <span>{imgProgress}%</span>
                      </div>
                      <Progress value={imgProgress} className="h-1.5" />
                    </div>
                  )}
                  {imgRisk && imgResultMsg && (
                    <Alert variant={imgRisk === "high" ? "destructive" : undefined} className={`mt-4
                      ${imgRisk === "high" ? "bg-red-100 border-red-200 text-red-800"
                      : imgRisk === "medium" ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                      : "bg-green-50 border-green-200 text-green-800"}`}>
                      {imgRisk === "high"
                        ? <AlertCircle className="h-5 w-5" />
                        : <Check className="h-5 w-5" />}
                      <AlertTitle>
                        {imgRisk === "low"
                          ? "Authentic Image Detected"
                          : imgRisk === "medium"
                            ? "Suspicious Elements Detected"
                            : "AI-Generated Image Detected"}
                      </AlertTitle>
                      <AlertDescription>
                        {imgResultMsg}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-3">
                <b>Note:</b> This fake detector is a demo and does not do real analysis yet.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips/FAQ */}
        <div className="max-w-2xl mx-auto mt-8 text-sm text-gray-500 text-center">
          <div className="mb-2">
            <span className="font-medium text-veritas-purple">Note:</span> This tool uses a combination of AI and rule-based models to detect fake profiles. Results may not be 100% accurate—always use your own judgment.
          </div>
          <div>
            Currently supports <span className="font-semibold">Instagram, Bumble, Tinder</span> and similar social networks.<br />
            <span>Backend logic and real verification coming soon!</span>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfileGuardScanner;

// File is getting long; next, split out <QuestionnaireStep />, <ProfileResultCard />, and <ImageChecker /> components.
