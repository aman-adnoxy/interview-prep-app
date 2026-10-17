import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Layers, 
  Search, 
  Sparkles, 
  Info,
  Maximize2
} from 'lucide-react';
import { sound } from '../services/sound';

/**
 * Interactive Diagram Renderer supporting:
 * 1. Step-by-step interactive walkthroughs (e.g. B-Tree path search for key 25)
 * 2. High-precision vector SVG diagrams
 * 3. Execution plan and node split flows
 */
/**
 * Clean and sanitize SVG markup to prevent script execution / attribute injection,
 * and scope IDs (e.g. markers, gradients, filters) to avoid collisions across multiple diagrams.
 */
function sanitizeAndScopeSvg(rawSvg, prefixId = 'diag') {
  if (!rawSvg || typeof rawSvg !== 'string') return '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
    
    // Check for parse error
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      console.warn('SVG parse error, fallback to text');
      return '';
    }

    // Strip unsafe elements: script, iframe, object, embed, foreignObject with html
    const forbiddenTags = ['script', 'iframe', 'object', 'embed'];
    forbiddenTags.forEach((tag) => {
      doc.querySelectorAll(tag).forEach((el) => el.remove());
    });

    // Strip all inline event handlers (onload, onclick, onerror, etc.)
    const allElements = doc.querySelectorAll('*');
    allElements.forEach((el) => {
      const attrs = Array.from(el.attributes);
      attrs.forEach((attr) => {
        if (attr.name.toLowerCase().startsWith('on') || attr.value.toLowerCase().includes('javascript:')) {
          el.removeAttribute(attr.name);
        }
      });
    });

    const svgEl = doc.querySelector('svg');
    if (!svgEl) return '';

    // Scope unique IDs in defs/markers/filters to prevent collision
    const idMap = new Map();
    const elementsWithId = svgEl.querySelectorAll('[id]');
    elementsWithId.forEach((el) => {
      const oldId = el.getAttribute('id');
      const newId = `${prefixId}_${oldId}`;
      idMap.set(oldId, newId);
      el.setAttribute('id', newId);
    });

    let serialized = new XMLSerializer().serializeToString(svgEl);
    idMap.forEach((newId, oldId) => {
      serialized = serialized.replaceAll(`url(#${oldId})`, `url(#${newId})`);
      serialized = serialized.replaceAll(`href="#${oldId}"`, `href="#${newId}"`);
      serialized = serialized.replaceAll(`xlink:href="#${oldId}"`, `xlink:href="#${newId}"`);
    });

    return serialized;
  } catch (e) {
    console.error('Failed to sanitize SVG:', e);
    return '';
  }
}

export default function DiagramBlock({ example }) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = example.steps || [];
  const hasSteps = steps.length > 0;
  const activeStep = hasSteps ? steps[currentStep] : null;

  const handleNextStep = () => {
    sound.playTap();
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    sound.playTap();
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const isBTree = example.format === 'interactive' && example.interactiveType === 'btree-search';
  const isSvg = example.format === 'svg';
  const isAscii = example.format === 'ascii';
  const isMermaid = example.format === 'mermaid';

  return (
    <div className="diagram-container-card">
      {/* Diagram Header */}
      <div className="diagram-header-bar">
        <div className="diagram-title-wrap">
          <Layers size={16} className="diagram-type-icon" />
          <span className="diagram-title">{example.title || 'Technical Diagram'}</span>
        </div>
        <span className="diagram-concept-badge">
          {example.format ? example.format.toUpperCase() : 'VISUAL'}
        </span>
      </div>

      {/* Main Diagram Canvas */}
      <div className="diagram-canvas">
        {isBTree ? (
          <BTreeInteractiveVisual activeStepIndex={currentStep} />
        ) : isSvg ? (
          <div 
            className="svg-graphic-wrapper"
            dangerouslySetInnerHTML={{ 
              __html: sanitizeAndScopeSvg(example.content, `svg_${example.title?.replace(/\s+/g, '_') || 'diag'}`) 
            }}
          />
        ) : isAscii ? (
          <div className="ascii-diagram-wrapper">
            <pre className="ascii-diagram-pre">{example.content}</pre>
          </div>
        ) : isMermaid ? (
          <div className="mermaid-diagram-card">
            <div className="mermaid-code-box">
              <pre className="mermaid-pre">{example.content}</pre>
            </div>
            {example.alt && <p className="diagram-alt-caption">{example.alt}</p>}
          </div>
        ) : (
          /* Text or general visual fallback */
          <div className="general-diagram-canvas">
            {example.content ? (
              <pre className="ascii-diagram-pre">{example.content}</pre>
            ) : (
              <p className="fallback-diagram-text">{example.alt || 'Technical diagram content'}</p>
            )}
          </div>
        )}
      </div>

      {/* Interactive Step-by-Step Walkthrough Drawer */}
      {hasSteps && activeStep && (
        <div className="stepper-control-box">
          <div className="stepper-top-row">
            <span className="stepper-step-indicator">
              STEP {activeStep.stepNumber} OF {steps.length}: {activeStep.title}
            </span>
          </div>

          <p className="stepper-explanation-text">
            {activeStep.description}
          </p>

          <div className="stepper-nav-row">
            <button 
              className="btn-stepper-nav"
              onClick={handlePrevStep}
              disabled={currentStep === 0}
            >
              <ChevronLeft size={18} />
              <span>Previous</span>
            </button>

            {/* Stepper Dots */}
            <div className="stepper-dots">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`stepper-dot ${i === currentStep ? 'active' : ''}`}
                  onClick={() => { sound.playTap(); setCurrentStep(i); }}
                />
              ))}
            </div>

            <button 
              className="btn-stepper-nav primary"
              onClick={handleNextStep}
              disabled={currentStep === steps.length - 1}
            >
              <span>Next Step</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Learning Point Footer */}
      {example.learningPoint && (
        <div className="diagram-footer-note">
          <Sparkles size={16} className="note-icon" />
          <p><strong>Takeaway:</strong> {example.learningPoint}</p>
        </div>
      )}

      <style>{`
        .diagram-container-card {
          background: #ffffff;
          border: 2px solid #e2e8f0;
          border-radius: var(--radius-md);
          overflow: hidden;
          box-shadow: 0 4px 0 #e2e8f0;
          display: flex;
          flex-direction: column;
          margin: 10px 0;
        }

        .diagram-header-bar {
          background: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .diagram-title-wrap {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .diagram-type-icon {
          color: var(--duo-blue-dark);
        }

        .diagram-title {
          font-size: 0.82rem;
          font-weight: 800;
          color: #1e293b;
        }

        .diagram-concept-badge {
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--duo-green-dark);
          background: var(--duo-green-bg);
          border: 1px solid #a7f3d0;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          text-transform: uppercase;
        }

        .diagram-canvas {
          padding: 20px 14px;
          background: #ffffff;
          overflow-x: auto;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .svg-graphic-wrapper {
          width: 100%;
          display: flex;
          justify-content: center;
          overflow-x: auto;
        }

        .svg-graphic-wrapper svg {
          max-width: 100%;
          height: auto;
          display: block;
        }

        .ascii-diagram-wrapper {
          width: 100%;
          background: #0f172a;
          border-radius: var(--radius-sm);
          padding: 16px;
          overflow-x: auto;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
        }

        .ascii-diagram-pre {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 0.82rem;
          line-height: 1.45;
          color: #38bdf8;
          margin: 0;
          white-space: pre;
        }

        .mermaid-diagram-card {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mermaid-code-box {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: var(--radius-sm);
          padding: 16px;
          overflow-x: auto;
        }

        .mermaid-pre {
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-size: 0.82rem;
          line-height: 1.4;
          color: #1e293b;
          margin: 0;
        }

        .diagram-alt-caption {
          font-size: 0.76rem;
          color: #64748b;
          font-style: italic;
          margin: 0;
          text-align: center;
        }

        .general-diagram-canvas {
          width: 100%;
          padding: 12px;
        }

        .fallback-diagram-text {
          color: #64748b;
          font-size: 0.88rem;
          text-align: center;
        }

        .stepper-control-box {
          background: #f8fafc;
          border-top: 2px solid #e2e8f0;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .stepper-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .stepper-step-indicator {
          font-size: 0.72rem;
          font-weight: 900;
          color: var(--duo-blue-dark);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .stepper-explanation-text {
          font-size: 0.92rem;
          color: #334155;
          line-height: 1.5;
          font-weight: 500;
        }

        .stepper-nav-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 6px;
        }

        .btn-stepper-nav {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 14px;
          border-radius: var(--radius-sm);
          font-size: 0.82rem;
          font-weight: 800;
          cursor: pointer;
          border: 2px solid #e2e8f0;
          background: #ffffff;
          color: #475569;
          box-shadow: 0 2px 0 #cbd5e1;
          transition: all 0.1s ease;
        }
        .btn-stepper-nav:hover:not(:disabled) {
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }
        .btn-stepper-nav:active:not(:disabled) {
          transform: translateY(2px);
          box-shadow: 0 0 0 #cbd5e1;
        }
        .btn-stepper-nav:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .btn-stepper-nav.primary {
          background: var(--duo-green);
          color: #ffffff;
          border-color: var(--duo-green);
          box-shadow: 0 2px 0 var(--duo-green-dark);
        }

        .stepper-dots {
          display: flex;
          gap: 6px;
        }

        .stepper-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #cbd5e1;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .stepper-dot.active {
          background: var(--duo-blue);
          width: 22px;
          border-radius: var(--radius-full);
        }

        .diagram-footer-note {
          background: #fffbeb;
          border-top: 1px solid #fde68a;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.84rem;
          color: #92400e;
        }

        .note-icon {
          color: #d97706;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}

/**
 * High-definition native SVG B-Tree Search visualization
 * Specifically highlights the path for key 25 across Root -> Middle Child -> Target Leaf
 */
function BTreeInteractiveVisual({ activeStepIndex = 0 }) {
  // Step 0: Root node highlighted (Keys 20 | 40)
  // Step 1: Traversal branch active (20 < 25 < 40)
  // Step 2: Leaf node reached & matched (Keys 22 | 25 | 31)
  const isRootActive = activeStepIndex === 0;
  const isBranchActive = activeStepIndex >= 1;
  const isLeafActive = activeStepIndex >= 2;

  return (
    <svg 
      viewBox="0 0 460 270" 
      width="100%" 
      height="auto" 
      style={{ maxWidth: '440px', overflow: 'visible' }}
    >
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
        </marker>
        <marker id="arrowActive" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#1cb0f6" />
        </marker>
        <filter id="shadowBox" x="-5%" y="-5%" width="115%" height="115%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.08" />
        </filter>
      </defs>

      {/* Target Key Banner */}
      <rect x="150" y="6" width="160" height="26" rx="13" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.5" />
      <text x="230" y="23" textAnchor="middle" fill="#0369a1" fontSize="11" fontWeight="800">
        SEARCH TARGET: KEY 25
      </text>

      {/* Connecting Branch Lines */}
      {/* Root to Left Child (Keys < 20) */}
      <path d="M 190 76 L 90 148" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3,3" markerEnd="url(#arrow)" />
      
      {/* Root to Middle Child (20 < Key < 40) - TARGET PATH */}
      <path 
        d="M 230 76 L 230 148" 
        fill="none" 
        stroke={isBranchActive ? '#1cb0f6' : '#cbd5e1'} 
        strokeWidth={isBranchActive ? '3.5' : '2'} 
        markerEnd={isBranchActive ? 'url(#arrowActive)' : 'url(#arrow)'} 
      />

      {/* Root to Right Child (Keys > 40) */}
      <path d="M 270 76 L 370 148" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3,3" markerEnd="url(#arrow)" />

      {/* ROOT NODE: [ 20 | 40 ] */}
      <g transform="translate(160, 42)">
        <rect 
          width="140" 
          height="34" 
          rx="8" 
          fill={isRootActive ? '#eff6ff' : '#ffffff'} 
          stroke={isRootActive ? '#1cb0f6' : '#94a3b8'} 
          strokeWidth={isRootActive ? '2.5' : '1.5'} 
          filter="url(#shadowBox)" 
        />
        <line x1="70" y1="0" x2="70" y2="34" stroke="#e2e8f0" strokeWidth="1.5" />
        <text x="35" y="22" textAnchor="middle" fill="#1e293b" fontSize="13" fontWeight="800">20</text>
        <text x="105" y="22" textAnchor="middle" fill="#1e293b" fontSize="13" fontWeight="800">40</text>
        <text x="70" y="47" textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="700">ROOT NODE</text>
      </g>

      {/* Branch comparison label when on step 1 */}
      {isBranchActive && (
        <rect x="180" y="105" width="100" height="20" rx="10" fill="#1cb0f6" />
      )}
      {isBranchActive && (
        <text x="230" y="119" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="800">
          20 &lt; 25 &lt; 40
        </text>
      )}

      {/* LEAF 1: Left Child [ 5 | 12 ] */}
      <g transform="translate(30, 154)">
        <rect width="110" height="34" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" filter="url(#shadowBox)" />
        <line x1="55" y1="0" x2="55" y2="34" stroke="#e2e8f0" strokeWidth="1.5" />
        <text x="27" y="22" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="700">5</text>
        <text x="82" y="22" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="700">12</text>
        <text x="55" y="48" textAnchor="middle" fill="#94a3b8" fontSize="9.5" fontWeight="600">Keys &lt; 20</text>
      </g>

      {/* LEAF 2: Middle Target Leaf [ 22 | 25 | 31 ] */}
      <g transform="translate(160, 154)">
        <rect 
          width="140" 
          height="34" 
          rx="8" 
          fill={isLeafActive ? '#ecfdf5' : '#ffffff'} 
          stroke={isLeafActive ? '#10b981' : '#cbd5e1'} 
          strokeWidth={isLeafActive ? '2.5' : '1.5'} 
          filter="url(#shadowBox)" 
        />
        <line x1="46" y1="0" x2="46" y2="34" stroke="#e2e8f0" strokeWidth="1.5" />
        <line x1="93" y1="0" x2="93" y2="34" stroke="#e2e8f0" strokeWidth="1.5" />
        <text x="23" y="22" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="700">22</text>
        
        {/* Highlight target 25 */}
        {isLeafActive ? (
          <rect x="47" y="1" width="45" height="32" fill="#10b981" rx="4" />
        ) : null}
        <text 
          x="69" 
          y="22" 
          textAnchor="middle" 
          fill={isLeafActive ? '#ffffff' : '#1e293b'} 
          fontSize="13" 
          fontWeight="900"
        >
          25
        </text>
        
        <text x="116" y="22" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="700">31</text>
        <text x="70" y="48" textAnchor="middle" fill={isLeafActive ? '#059669' : '#64748b'} fontSize="10" fontWeight="800">
          {isLeafActive ? '✓ MATCH FOUND' : 'Target Leaf'}
        </text>
      </g>

      {/* LEAF 3: Right Child [ 45 | 60 ] */}
      <g transform="translate(320, 154)">
        <rect width="110" height="34" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" filter="url(#shadowBox)" />
        <line x1="55" y1="0" x2="55" y2="34" stroke="#e2e8f0" strokeWidth="1.5" />
        <text x="27" y="22" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="700">45</text>
        <text x="82" y="22" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="700">60</text>
        <text x="55" y="48" textAnchor="middle" fill="#94a3b8" fontSize="9.5" fontWeight="600">Keys &gt; 40</text>
      </g>

      {/* Linked List pointer between leaves (B+ tree representation) */}
      <path d="M 140 171 L 160 171" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow)" />
      <path d="M 300 171 L 320 171" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow)" />
      <text x="230" y="225" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="600">
        Leaf nodes form a doubly linked list for range scans
      </text>
    </svg>
  );
}
