import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { AlertTriangle, Shield, Phone, Mail, ExternalLink } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Red flag patterns with explanations
const redFlagPatterns = [
  {
    pattern: /(?:don't tell|keep.*secret|between us|our little secret)/i,
    category: "Secrecy",
    explanation: "Requesting secrecy is a common manipulation tactic"
  },
  {
    pattern: /(?:you're overreacting|you're too sensitive|calm down|you're crazy)/i,
    category: "Gaslighting",
    explanation: "Dismissing feelings and making you doubt yourself"
  },
  {
    pattern: /(?:if you loved me|prove.*love|if you care)/i,
    category: "Emotional Manipulation",
    explanation: "Using love or care as leverage for demands"
  },
  {
    pattern: /(?:nobody else will|you'll never find|you need me)/i,
    category: "Isolation",
    explanation: "Attempting to create dependency and isolation"
  },
  {
    pattern: /(?:you made me|look what you made|because of you)/i,
    category: "Blame Shifting",
    explanation: "Shifting responsibility for their actions to you"
  },
  {
    pattern: /(?:i'll hurt myself|can't live without|kill myself)/i,
    category: "Threats/Coercion",
    explanation: "Using threats of self-harm as manipulation"
  },
  {
    pattern: /(?:you owe me|after all i've done|i've given you)/i,
    category: "Guilt Trip",
    explanation: "Using guilt to manipulate behavior"
  },
  {
    pattern: /(?:everyone thinks you're|nobody likes you|they all say)/i,
    category: "Social Manipulation",
    explanation: "Using social pressure or isolation as control"
  }
];

// Emergency helpline data by region - expanded with more Indian cities
const helplineData = {
  "Delhi": [
    {
      name: "Delhi Commission for Women",
      number: "181",
      type: "Government",
      email: "helpline@dcw.gov.in"
    },
    {
      name: "Delhi Police Women Helpline",
      number: "1091",
      type: "Police",
      email: null
    }
  ],
  "Mumbai": [
    {
      name: "Maharashtra Women Commission",
      number: "022-26592707",
      type: "Government",
      email: "mscw.support@maharashtra.gov.in"
    },
    {
      name: "Mumbai Police Women Helpline",
      number: "103",
      type: "Police",
      email: null
    }
  ],
  "Bangalore": [
    {
      name: "Vanitha Sahayavani",
      number: "1091",
      type: "Police",
      email: null
    },
    {
      name: "Karnataka Women Commission",
      number: "080-22100435",
      type: "Government",
      email: "kswc@karnataka.gov.in"
    }
  ],
  "Chennai": [
    {
      name: "Tamil Nadu Women Helpline",
      number: "181",
      type: "Government",
      email: "tnwc@tn.gov.in"
    },
    {
      name: "Chennai Police Women Helpline",
      number: "1091",
      type: "Police",
      email: null
    }
  ],
  "Kolkata": [
    {
      name: "West Bengal Women Commission",
      number: "033-23357651",
      type: "Government",
      email: "wbcw@wb.gov.in"
    },
    {
      name: "Kolkata Police Women Helpline",
      number: "1091",
      type: "Police",
      email: null
    }
  ],
  "Hyderabad": [
    {
      name: "Telangana Women Commission",
      number: "040-23312125",
      type: "Government",
      email: "tswc@telangana.gov.in"
    },
    {
      name: "SHE Teams Helpline",
      number: "9490617444",
      type: "Police",
      email: null
    }
  ],
  "Pune": [
    {
      name: "Pune Police Women Helpline",
      number: "1091",
      type: "Police",
      email: null
    },
    {
      name: "Maharashtra State Women Commission",
      number: "022-26592707",
      type: "Government",
      email: "mscw.support@maharashtra.gov.in"
    }
  ],
  "Ahmedabad": [
    {
      name: "Gujarat Women Commission",
      number: "079-23251604",
      type: "Government",
      email: "gwc@gujarat.gov.in"
    },
    {
      name: "Abhayam 181 Helpline",
      number: "181",
      type: "Government",
      email: null
    }
  ],
  "Jaipur": [
    {
      name: "Rajasthan Women Commission",
      number: "0141-2785537",
      type: "Government",
      email: "rwc@rajasthan.gov.in"
    },
    {
      name: "Women Helpline 181",
      number: "181",
      type: "Government",
      email: null
    }
  ],
  "Lucknow": [
    {
      name: "UP Women Commission",
      number: "0522-2306611",
      type: "Government",
      email: "upwc@up.gov.in"
    },
    {
      name: "UP Police Women Helpline",
      number: "1090",
      type: "Police",
      email: null
    }
  ],
  "Kochi": [
    {
      name: "Kerala Women Commission",
      number: "0471-2322590",
      type: "Government",
      email: "kwc@kerala.gov.in"
    },
    {
      name: "Kerala Police Women Cell",
      number: "0484-2827005",
      type: "Police",
      email: null
    }
  ],
  "Chandigarh": [
    {
      name: "Chandigarh Women Commission",
      number: "0172-2741900",
      type: "Government",
      email: "cwc@chandigarh.gov.in"
    },
    {
      name: "Women Helpline 181",
      number: "181",
      type: "Government",
      email: null
    }
  ],
  "Indore": [
    {
      name: "MP Women Commission",
      number: "0755-2661813",
      type: "Government",
      email: "mpwc@mp.gov.in"
    },
    {
      name: "Women Helpline 181",
      number: "181",
      type: "Government",
      email: null
    }
  ],
  "Bhubaneswar": [
    {
      name: "Odisha Women Commission",
      number: "0674-2393118",
      type: "Government",
      email: "owc@odisha.gov.in"
    },
    {
      name: "Women Helpline 181",
      number: "181",
      type: "Government",
      email: null
    }
  ],
  "Guwahati": [
    {
      name: "Assam Women Commission",
      number: "0361-2465668",
      type: "Government",
      email: "awc@assam.gov.in"
    },
    {
      name: "Women Helpline 181",
      number: "181",
      type: "Government",
      email: null
    }
  ]
};

interface RedFlag {
  phrase: string;
  category: string;
  explanation: string;
}

interface Helpline {
  name: string;
  number: string;
  type: string;
  email: string | null;
}

const SafetyAnalyzer = () => {
  const [chatText, setChatText] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [redFlags, setRedFlags] = useState<RedFlag[]>([]);
  const [threatLevel, setThreatLevel] = useState<'low' | 'moderate' | 'high' | null>(null);
  const { toast } = useToast();

  const analyzeChatText = () => {
    if (!chatText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some chat text to analyze",
        variant: "destructive",
      });
      return;
    }

    const foundFlags: RedFlag[] = [];
    
    // Check each pattern against the text
    redFlagPatterns.forEach(pattern => {
      const matches = chatText.match(pattern.pattern);
      if (matches) {
        foundFlags.push({
          phrase: matches[0],
          category: pattern.category,
          explanation: pattern.explanation
        });
      }
    });

    setRedFlags(foundFlags);

    // Determine threat level
    if (foundFlags.length > 3) {
      setThreatLevel('high');
    } else if (foundFlags.length >= 2) {
      setThreatLevel('moderate');
    } else if (foundFlags.length > 0) {
      setThreatLevel('low');
    } else {
      setThreatLevel(null);
    }

    toast({
      title: "Analysis Complete",
      description: `Found ${foundFlags.length} potential red flags`,
    });
  };

  const getThreatLevelColor = (level: string | null) => {
    switch (level) {
      case 'high':
        return 'bg-red-500';
      case 'moderate':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-200';
    }
  };

  const getThreatLevelText = (level: string | null) => {
    switch (level) {
      case 'high':
        return 'High Risk - Multiple concerning patterns detected';
      case 'moderate':
        return 'Moderate Risk - Some concerning patterns present';
      case 'low':
        return 'Low Risk - Minor concerning patterns detected';
      default:
        return 'No Risk Detected';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-grow bg-gray-50">
        <div className="veritas-container">
          <div className="max-w-4xl mx-auto">
            <h1 className="page-title">Safety Analyzer</h1>
            <p className="text-center text-gray-600 mb-8">
              Analyze chat messages for potential red flags and get safety resources
            </p>

            <div className="grid gap-6">
              {/* Chat Analyzer Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Chat Message Analyzer</CardTitle>
                  <CardDescription>
                    Paste chat messages to check for concerning patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Paste chat messages here..."
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      className="min-h-[200px]"
                    />
                    <Button onClick={analyzeChatText} className="w-full">
                      Analyze Messages
                    </Button>

                    {threatLevel && (
                      <div className="mt-6 space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Threat Level</span>
                            <span className="font-medium capitalize">{threatLevel}</span>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className={`h-2.5 rounded-full ${getThreatLevelColor(threatLevel)}`}
                                    style={{
                                      width: threatLevel === 'high' ? '100%' : 
                                             threatLevel === 'moderate' ? '66%' : '33%'
                                    }}
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{getThreatLevelText(threatLevel)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        {redFlags.length > 0 && (
                          <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phrase</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Explanation</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {redFlags.map((flag, index) => (
                                  <tr key={index}>
                                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{flag.phrase}</td>
                                    <td className="px-4 py-2 text-sm text-gray-500">{flag.category}</td>
                                    <td className="px-4 py-2 text-sm text-gray-500">{flag.explanation}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Helpline Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Emergency Helplines</CardTitle>
                  <CardDescription>
                    Find local helplines and support services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Select
                      value={selectedRegion}
                      onValueChange={setSelectedRegion}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your region" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(helplineData).map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedRegion && (
                      <div className="grid gap-4">
                        {helplineData[selectedRegion as keyof typeof helplineData].map((helpline, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h3 className="font-medium">{helpline.name}</h3>
                              <p className="text-sm text-gray-500">{helpline.type}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {helpline.email && (
                                <Button variant="outline" size="sm" asChild>
                                  <a href={`mailto:${helpline.email}`}>
                                    <Mail className="h-4 w-4 mr-1" />
                                    Email
                                  </a>
                                </Button>
                              )}
                              <Button variant="outline" size="sm" asChild>
                                <a href={`tel:${helpline.number}`}>
                                  <Phone className="h-4 w-4 mr-1" />
                                  {helpline.number}
                                </a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Emergency Situations</AlertTitle>
                      <AlertDescription>
                        If you're in immediate danger, always call your local emergency services first.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SafetyAnalyzer;
