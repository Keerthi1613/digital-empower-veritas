
import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { FileText, CheckCircle, X, AlertTriangle, Shield } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const Quiz = () => {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const questions: Question[] = [
    {
      id: 1,
      text: "How can you identify a potential deepfake or AI-generated profile picture?",
      options: [
        "The image has perfect lighting",
        "Look for asymmetrical features, strange backgrounds, or distorted accessories",
        "The person is extremely attractive",
        "The image has a watermark"
      ],
      correctAnswer: 1,
      explanation: "AI-generated images often have telltale signs like asymmetrical facial features, strange backgrounds, distorted accessories or jewelry, or bizarre finger arrangements. Look closely at details like ears, eyes, and backgrounds."
    },
    {
      id: 2,
      text: "What should you do if someone online is pressuring you for personal information?",
      options: [
        "Share limited information to build trust",
        "Block them immediately and report to the platform",
        "Ask them personal questions in return",
        "Tell them you'll share information later"
      ],
      correctAnswer: 1,
      explanation: "Never give in to pressure for personal information. Legitimate contacts will respect your boundaries. Block and report anyone who pressures you for personal information, as this is a common tactic used by scammers and predators."
    },
    {
      id: 3,
      text: "Which of the following is NOT a secure practice for online dating?",
      options: [
        "Meeting in a public place for your first date",
        "Sharing your home address so they can pick you up",
        "Telling a friend who you're meeting and where",
        "Video chatting before meeting in person"
      ],
      correctAnswer: 1,
      explanation: "Never share your home address with someone you've only met online. Always arrange your own transportation to and from your first meeting, which should be in a public place during daylight hours. Tell someone you trust about your plans."
    },
    {
      id: 4,
      text: "What is the most secure way to create passwords for your accounts?",
      options: [
        "Use your pet's name followed by your birth year",
        "Use the same complex password for all accounts",
        "Use unique passphrases with a mix of characters for each account",
        "Use passwords that are easy to remember like '123456'"
      ],
      correctAnswer: 2,
      explanation: "The most secure passwords are unique for each site, long (12+ characters), use a mix of letters, numbers and symbols, and are changed regularly. Consider using a password manager to generate and store complex passwords safely."
    },
    {
      id: 5,
      text: "If you receive a suspicious link in a message, what should you do?",
      options: [
        "Open it in incognito mode to be safe",
        "Click it to see what it is, then decide if it's dangerous",
        "Ask the sender what the link is before clicking",
        "Don't click it and report the message as suspicious"
      ],
      correctAnswer: 3,
      explanation: "Never click suspicious links as they could contain malware or lead to phishing sites. Even if the message appears to come from someone you know, their account may be compromised. When in doubt, contact the supposed sender through another verified channel."
    }
  ];

  const handleOptionSelect = (optionIndex: number) => {
    if (showExplanation) return; // Prevent changing answer after submitting
    setSelectedOption(optionIndex);
  };

  const handleNextQuestion = () => {
    // Reset for next question
    setSelectedOption(null);
    setShowExplanation(false);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizCompleted(true);
      toast({
        title: "Quiz Completed!",
        description: `Your final score: ${score} out of ${questions.length}`,
      });
    }
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null) {
      toast({
        title: "Please select an answer",
        description: "You need to choose an option before checking your answer.",
        variant: "destructive",
      });
      return;
    }
    
    setShowExplanation(true);
    
    if (selectedOption === questions[currentQuestionIndex].correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setScore(0);
    setQuizCompleted(false);
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-grow">
        <div className="veritas-container">
          <div className="max-w-3xl mx-auto">
            <h1 className="page-title">Digital Self-Defense Quiz</h1>
            <p className="text-center text-gray-600 mb-8">
              Test your knowledge and learn essential skills to stay safe online.
            </p>

            {!quizCompleted ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md">
                <div className="flex justify-between items-center mb-6">
                  <span className="bg-veritas-purple text-white text-sm px-3 py-1 rounded-full">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <span className="text-gray-600 text-sm font-medium">
                    Score: {score}/{currentQuestionIndex + (showExplanation ? 1 : 0)}
                  </span>
                </div>

                <h2 className="text-xl font-semibold mb-6">{currentQuestion.text}</h2>

                <div className="space-y-3 mb-8">
                  {currentQuestion.options.map((option, index) => (
                    <div
                      key={index}
                      onClick={() => handleOptionSelect(index)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedOption === index
                          ? showExplanation
                            ? index === currentQuestion.correctAnswer
                              ? "bg-green-50 border-green-300"
                              : "bg-red-50 border-red-300"
                            : "bg-veritas-lightPurple border-veritas-purple"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                          selectedOption === index
                            ? showExplanation
                              ? index === currentQuestion.correctAnswer
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                              : "bg-veritas-purple text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}>
                          {showExplanation && selectedOption === index ? (
                            index === currentQuestion.correctAnswer ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <X className="h-4 w-4" />
                            )
                          ) : (
                            <span className="text-xs">{String.fromCharCode(65 + index)}</span>
                          )}
                        </div>
                        <span className={`${
                          showExplanation && index === currentQuestion.correctAnswer
                            ? "font-medium text-green-800"
                            : ""
                        }`}>
                          {option}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {showExplanation && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <Shield className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-blue-800 mb-1">Explanation</h3>
                        <p className="text-sm text-blue-700">{currentQuestion.explanation}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  {!showExplanation ? (
                    <button onClick={handleCheckAnswer} className="btn-primary w-full">
                      Check Answer
                    </button>
                  ) : (
                    <button onClick={handleNextQuestion} className="btn-primary w-full">
                      {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-md text-center">
                <div className="mb-6">
                  {score >= questions.length * 0.8 ? (
                    <div className="bg-green-100 rounded-full p-4 mx-auto w-20 h-20 flex items-center justify-center">
                      <Shield className="h-10 w-10 text-green-600" />
                    </div>
                  ) : score >= questions.length * 0.5 ? (
                    <div className="bg-yellow-100 rounded-full p-4 mx-auto w-20 h-20 flex items-center justify-center">
                      <Shield className="h-10 w-10 text-yellow-600" />
                    </div>
                  ) : (
                    <div className="bg-orange-100 rounded-full p-4 mx-auto w-20 h-20 flex items-center justify-center">
                      <AlertTriangle className="h-10 w-10 text-orange-600" />
                    </div>
                  )}
                </div>
                
                <h2 className="text-2xl font-bold mb-4">Quiz Completed!</h2>
                
                <div className="text-4xl font-bold text-veritas-purple mb-2">
                  {score} / {questions.length}
                </div>
                <p className="text-gray-600 mb-6">
                  {score >= questions.length * 0.8
                    ? "Excellent! You have great digital safety knowledge."
                    : score >= questions.length * 0.5
                    ? "Good job! Keep learning to stay even safer online."
                    : "You have some learning to do. Study the safety tips to improve your score!"}
                </p>
                
                <div className="bg-veritas-lightPurple p-4 rounded-lg mb-8">
                  <h3 className="text-lg font-medium mb-2 text-veritas-purple">Safety Tips Recap</h3>
                  <ul className="text-left text-sm text-gray-700 space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-veritas-purple mr-2 mt-0.5" />
                      Always verify the identity of people you meet online before sharing personal information
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-veritas-purple mr-2 mt-0.5" />
                      Use strong, unique passwords for each of your online accounts
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-veritas-purple mr-2 mt-0.5" />
                      Be wary of suspicious links, even from friends (their accounts might be compromised)
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-veritas-purple mr-2 mt-0.5" />
                      Always meet new online contacts in public places and tell someone where you're going
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-veritas-purple mr-2 mt-0.5" />
                      Learn to identify AI-generated fake images and deepfakes
                    </li>
                  </ul>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button onClick={handleRestartQuiz} className="btn-primary">
                    Restart Quiz
                  </button>
                  <a href="/profile-guard" className="btn-outline">
                    Try Profile Scanner
                  </a>
                </div>
              </div>
            )}
            
            <div className="mt-10 bg-white rounded-xl border border-gray-200 p-6 shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-veritas-purple">Why Digital Self-Defense Matters</h2>
              <p className="text-gray-600 mb-4">
                With growing online threats targeting women, knowing how to protect yourself digitally 
                is as important as physical self-defense. These quiz questions are based on real-world 
                scenarios and expert safety recommendations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-veritas-lightPurple p-4 rounded-lg">
                  <h3 className="font-medium text-veritas-purple mb-2">Learn To Identify</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li className="flex items-center">
                      <FileText className="h-3 w-3 text-veritas-purple mr-2" />
                      Deepfake images and videos
                    </li>
                    <li className="flex items-center">
                      <FileText className="h-3 w-3 text-veritas-purple mr-2" />
                      Romance scams and catfishing attempts
                    </li>
                    <li className="flex items-center">
                      <FileText className="h-3 w-3 text-veritas-purple mr-2" />
                      Phishing messages and suspicious links
                    </li>
                  </ul>
                </div>
                <div className="bg-veritas-lightPurple p-4 rounded-lg">
                  <h3 className="font-medium text-veritas-purple mb-2">Protect Yourself From</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li className="flex items-center">
                      <Shield className="h-3 w-3 text-veritas-purple mr-2" />
                      Online harassment and stalking
                    </li>
                    <li className="flex items-center">
                      <Shield className="h-3 w-3 text-veritas-purple mr-2" />
                      Identity theft and impersonation
                    </li>
                    <li className="flex items-center">
                      <Shield className="h-3 w-3 text-veritas-purple mr-2" />
                      Privacy invasions and data breaches
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Quiz;
