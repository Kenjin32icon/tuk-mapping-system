import React, { useState, useEffect } from 'react';
import { X, ChevronRight, SkipForward } from 'lucide-react';

// Safe import for Vite CommonJS/ESM Interop
import * as JoyrideModule from 'react-joyride';
const Joyride = JoyrideModule.default ? JoyrideModule.default : JoyrideModule.Joyride || JoyrideModule;
const STATUS = JoyrideModule.STATUS || {};

const OnboardingTour = ({ run, onComplete, user, userRole, view, masterProfile }) => {
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    // Dynamic steps based on user state and current view
    const baseSteps = [
      {
        target: 'body',
        content: (
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-800 mb-2">🎓 Welcome to TU-K Talent Portal!</h3>
            <p className="text-slate-600 mb-4">
              Let's take a quick tour to help you discover how to transform your academic journey into career success.
            </p>
            <div className="flex justify-center gap-2 text-sm text-slate-500">
              <span>⏱️ 2-3 minutes</span>
              <span>•</span>
              <span>Skip anytime</span>
            </div>
          </div>
        ),
        placement: 'center',
        disableBeacon: true,
      }
    ];

    // Add steps based on current state
    if (view === 'landing') {
      baseSteps.push(
        {
          target: '.login-section',
          content: (
            <div>
              <h4 className="font-bold text-slate-800 mb-2">🔐 Get Started</h4>
              <p className="text-slate-600 mb-2">
                Sign in with your Google account for full access to AI-powered career mapping, or explore as a guest to see the system in action.
              </p>
              <p className="text-xs text-emerald-600 font-medium">💡 Pro tip: Guest mode lets you try all features!</p>
            </div>
          ),
          placement: 'bottom',
        },
        {
          target: '.guest-button',
          content: (
            <div>
              <h4 className="font-bold text-slate-800 mb-2">🚀 Quick Demo</h4>
              <p className="text-slate-600">
                Try the interactive demo to see how the AI analyzes skills and creates career recommendations.
              </p>
            </div>
          ),
          placement: 'top',
        }
      );
    }

    if (view === 'onboarding' && user) {
      baseSteps.push(
        {
          target: '.upload-section',
          content: (
            <div>
              <h4 className="font-bold text-slate-800 mb-2">📄 Upload Your Documents</h4>
              <p className="text-slate-600 mb-2">
                Upload up to 5 documents including your CV, transcripts, certificates, or project reports.
              </p>
              <p className="text-xs text-blue-600 font-medium">📋 Supported: PDF, DOC, DOCX, TXT files</p>
            </div>
          ),
          placement: 'bottom',
        }
      );
    }

    if (view === 'dashboard' && user) {
      baseSteps.push(
        {
          target: '.profile-action-bar',
          content: (
            <div>
              <h4 className="font-bold text-slate-800 mb-2">🎯 Your Profile Hub</h4>
              <p className="text-slate-600 mb-2">
                This is your command center. Generate your Master Profile to unlock AI-powered career insights.
              </p>
              {!masterProfile && (
                <p className="text-xs text-emerald-600 font-medium">💡 Click "Generate Master Profile" to get started!</p>
              )}
            </div>
          ),
          placement: 'bottom',
        }
      );

      if (masterProfile) {
        baseSteps.push(
          {
            target: '.module-navigation',
            content: (
              <div>
                <h4 className="font-bold text-slate-800 mb-2">🧭 Explore Your Modules</h4>
                <p className="text-slate-600 mb-2">
                  Access detailed insights about your skills, market alignment, and recommended services.
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs mt-3">
                  <div className="text-center">
                    <div className="text-blue-600 font-bold">Skills</div>
                    <div className="text-slate-500">Analysis</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-600 font-bold">Market</div>
                    <div className="text-slate-500">Alignment</div>
                  </div>
                  <div className="text-center">
                    <div className="text-purple-600 font-bold">Services</div>
                    <div className="text-slate-500">Portfolio</div>
                  </div>
                </div>
              </div>
            ),
            placement: 'bottom',
          }
        );
      }
    }

    // Always include settings step for logged-in users
    if (user && userRole !== 'GUEST') {
      baseSteps.push(
        {
          target: '.navbar-menu',
          content: (
            <div>
              <h4 className="font-bold text-slate-800 mb-2">⚙️ Customize Your Profile</h4>
              <p className="text-slate-600 mb-2">
                Access settings to add your contact information, social media links, and portfolio details.
              </p>
              <p className="text-xs text-slate-500">📱 Add phone numbers for direct contact links</p>
            </div>
          ),
          placement: 'bottom',
        }
      );
    }

    // Final encouragement step
    baseSteps.push(
      {
        target: 'body',
        content: (
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-800 mb-2">🎉 You're All Set!</h3>
            <p className="text-slate-600 mb-4">
              Start exploring your career potential. Remember, you can always revisit this tour from the help menu.
            </p>
            <div className="bg-emerald-50 p-3 rounded-lg">
              <p className="text-sm text-emerald-800 font-medium">
                💡 <strong>Next steps:</strong> Upload documents → Generate Master Profile → Explore modules
              </p>
            </div>
          </div>
        ),
        placement: 'center',
      }
    );

    setSteps(baseSteps);
  }, [user, userRole, view, masterProfile]);

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      onComplete();
    }
  };

  const customStyles = {
    options: {
      primaryColor: '#10b981', // emerald-500
      textColor: '#1f2937', // slate-800
      backgroundColor: '#ffffff',
      overlayColor: 'rgba(0, 0, 0, 0.4)',
      spotlightShadow: '0 0 15px rgba(16, 185, 129, 0.2)',
      beaconSize: 36,
      zIndex: 100,
    },
    tooltip: {
      borderRadius: 12,
      fontSize: 14,
    },
    tooltipContainer: {
      textAlign: 'left',
    },
    buttonNext: {
      backgroundColor: '#10b981',
      fontSize: 14,
      fontWeight: 'bold',
      borderRadius: 8,
      padding: '8px 16px',
    },
    buttonBack: {
      color: '#6b7280',
      fontSize: 14,
      marginRight: 8,
    },
    buttonSkip: {
      color: '#6b7280',
      fontSize: 14,
    },
    buttonClose: {
      height: 14,
      width: 14,
      top: 15,
      right: 15,
    },
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      callback={handleJoyrideCallback}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      disableOverlayClose={false}
      disableCloseOnEsc={false}
      hideCloseButton={false}
      styles={customStyles}
      locale={{
        back: 'Previous',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        open: 'Open',
        skip: 'Skip Tour',
      }}
    />
  );
};

export default OnboardingTour;