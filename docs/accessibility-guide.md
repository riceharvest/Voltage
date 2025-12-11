# Accessibility Guide - Energy Drink Calculator Application

> **Version**: 1.0.0 | **Standards**: WCAG 2.1 AA Compliant | **Languages**: English, Dutch

## ♿ Accessibility Overview

The Energy Drink Calculator application is designed to be accessible to all users, regardless of their abilities or the assistive technologies they use. This guide explains the accessibility features built into the application and how to use them effectively.

### Accessibility Commitment

- **WCAG 2.1 AA Compliance**: Meeting international accessibility standards
- **Universal Design**: Accessible to users with diverse needs
- **Assistive Technology Support**: Compatible with screen readers and other tools
- **Keyboard Navigation**: Full functionality without mouse
- **Visual Accessibility**: High contrast and scalable text support

---

## 📋 Table of Contents

1. [Built-in Accessibility Features](#1-built-in-accessibility-features)
2. [Keyboard Navigation](#2-keyboard-navigation)
3. [Screen Reader Support](#3-screen-reader-support)
4. [Visual Accessibility](#4-visual-accessibility)
5. [Motor Accessibility](#5-motor-accessibility)
6. [Cognitive Accessibility](#6-cognitive-accessibility)
7. [Assistive Technology Setup](#7-assistive-technology-setup)
8. [Browser Accessibility Settings](#8-browser-accessibility-settings)
9. [Troubleshooting Accessibility Issues](#9-troubleshooting-accessibility-issues)
10. [Feedback and Support](#10-feedback-and-support)

---

## 1. Built-in Accessibility Features

### 1.1 Semantic HTML Structure

#### Proper Heading Hierarchy
- **H1**: Main page title
- **H2**: Section headings
- **H3**: Subsection headings
- **H4**: Component headings

#### Semantic Elements
- **Navigation**: `<nav>` elements for menu structures
- **Main Content**: `<main>` for primary content
- **Articles**: `<article>` for recipe and flavor content
- **Sections**: `<section>` for grouped content
- **Footer**: `<footer>` for footer information

### 1.2 ARIA Labels and Descriptions

#### Interactive Elements
- **Buttons**: Clear action descriptions
- **Form Fields**: Proper labels and instructions
- **Links**: Descriptive link text
- **Images**: Alternative text descriptions

#### Dynamic Content
- **Live Regions**: Announce changes in calculations
- **Status Messages**: Describe success and error states
- **Progress Indicators**: Accessible progress bars
- **Toast Notifications**: Screen reader announcements

### 1.3 Focus Management

#### Logical Tab Order
- **Sequential Navigation**: Tab moves through elements in logical order
- **Skip Links**: Jump directly to main content
- **Visible Focus**: Clear focus indicators on all interactive elements
- **Focus Trapping**: Proper focus management in modals and dialogs

#### Keyboard Interaction
- **Enter/Space**: Activate buttons and links
- **Escape**: Close dialogs and modals
- **Arrow Keys**: Navigate within components
- **Tab/Shift+Tab**: Move forward/backward

---

## 2. Keyboard Navigation

### 2.1 Global Keyboard Shortcuts

#### Navigation Shortcuts
| Shortcut | Action |
|----------|--------|
| `Tab` | Move to next interactive element |
| `Shift + Tab` | Move to previous interactive element |
| `Enter` | Activate focused element |
| `Space` | Activate buttons and checkboxes |
| `Escape` | Close dialogs and cancel actions |
| `Home` | Jump to first element |
| `End` | Jump to last element |

#### Application Shortcuts
| Shortcut | Action |
|----------|--------|
| `Alt + H` | Jump to home page |
| `Alt + C` | Jump to calculator |
| `Alt + F` | Jump to flavors |
| `Alt + R` | Jump to recipes |
| `Alt + S` | Jump to safety information |
| `Alt + L` | Switch language |

### 2.2 Calculator Keyboard Navigation

#### Input Navigation
1. **Tab to Calculator**: Move to calculator section
2. **Tab through Fields**: Navigate input fields in order
3. **Enter Values**: Type values in focused fields
4. **Tab to Button**: Navigate to calculate button
5. **Press Enter**: Execute calculation

#### Results Navigation
1. **Tab to Results**: Move to results section
2. **Navigate with Arrow Keys**: Move through ingredient list
3. **Tab to Actions**: Navigate to export/print buttons
4. **Enter/Space**: Activate selected action

### 2.3 Flavor and Recipe Navigation

#### Flavor Library
1. **Tab to Search**: Navigate to search field
2. **Tab to Filters**: Navigate filter options
3. **Tab to Flavor Grid**: Move to flavor cards
4. **Arrow Keys**: Navigate between flavor cards
5. **Enter**: Open selected flavor details

#### Recipe Management
1. **Tab to Recipe List**: Navigate to saved recipes
2. **Arrow Keys**: Navigate between recipes
3. **Enter**: Open selected recipe
4. **Tab to Actions**: Navigate to edit/delete buttons

---

## 3. Screen Reader Support

### 3.1 Supported Screen Readers

#### Tested Compatibility
- **NVDA** (Windows): Full compatibility
- **JAWS** (Windows): Full compatibility
- **VoiceOver** (macOS/iOS): Full compatibility
- **TalkBack** (Android): Full compatibility
- **Narrator** (Windows): Full compatibility

### 3.2 Screen Reader Features

#### Content Announcements
- **Page Titles**: Clear page identification
- **Section Headings**: Logical content structure
- **Form Labels**: Descriptive field labels
- **Error Messages**: Clear error descriptions
- **Success Messages**: Confirmation announcements

#### Dynamic Content
- **Calculation Results**: Live region updates
- **Loading States**: Progress announcements
- **Safety Warnings**: Priority announcements
- **Offline Status**: Connection status updates

### 3.3 Screen Reader Navigation

#### Navigation Techniques
1. **Headings Mode**: Jump between sections using heading navigation
2. **Landmarks**: Navigate using page landmarks
3. **Links List**: View all links on page
4. **Forms Mode**: Navigate form fields systematically
5. **Virtual Cursor**: Browse content linearly

#### Content Organization
- **Descriptive Headings**: Each section clearly labeled
- **List Structures**: Proper list markup for screen readers
- **Table Headers**: Clear table structure with headers
- **Image Descriptions**: Alternative text for all images

---

## 4. Visual Accessibility

### 4.1 Color and Contrast

#### High Contrast Ratios
- **Text Contrast**: Minimum 4.5:1 ratio for normal text
- **Large Text**: Minimum 3:1 ratio for large text
- **Interactive Elements**: Minimum 3:1 ratio for UI components
- **Background Elements**: Sufficient contrast for readability

#### Color Independence
- **Information Not Color-Only**: No information conveyed by color alone
- **Status Indicators**: Icons and text accompany color changes
- **Error States**: Clear non-color indicators for errors
- **Success States**: Text and icons for positive feedback

### 4.2 Text and Typography

#### Scalable Text
- **Responsive Font Sizes**: Text scales with browser zoom
- **Minimum Font Size**: 16px base size for readability
- **Line Height**: 1.5x line height for readability
- **Letter Spacing**: Adequate spacing between characters

#### Font Choices
- **Readable Fonts**: Sans-serif fonts for digital content
- **Avoid Script Fonts**: No decorative fonts for important text
- **Consistent Typography**: Uniform font usage throughout
- **Fallback Fonts**: System fonts for accessibility

### 4.3 Visual Focus Indicators

#### Focus Styles
- **High Contrast**: Clear focus outline with sufficient contrast
- **Consistent Styling**: Uniform focus indicators across interface
- **Size and Shape**: Adequate size for easy visibility
- **Not Color-Only**: Focus indicators not solely color-based

#### Focus Examples
- **Input Fields**: Blue outline with 2px border
- **Buttons**: Dashed outline with 2px border
- **Links**: Underline and color change
- **Interactive Cards**: Clear border and background change

---

## 5. Motor Accessibility

### 5.1 Large Touch Targets

#### Minimum Target Sizes
- **Interactive Elements**: Minimum 44px × 44px
- **Buttons**: Adequate size for easy activation
- **Form Fields**: Sufficient height for easy interaction
- **Links**: Clickable area extends beyond visible text

#### Spacing Between Elements
- **Adequate Spacing**: Sufficient space between touch targets
- **No Overlapping**: Interactive elements don't overlap
- **Margin Consideration**: Touch targets include margin space
- **Error Prevention**: Large targets reduce mis-clicks

### 5.2 Alternative Input Methods

#### Keyboard Navigation
- **Full Keyboard Support**: All functionality accessible via keyboard
- **Logical Tab Order**: Sequential navigation through elements
- **Keyboard Shortcuts**: Convenient shortcuts for common actions
- **No Mouse Required**: Complete functionality without mouse

#### Voice Control
- **Clear Labels**: Descriptive element names for voice control
- **Consistent Naming**: Uniform naming conventions
- **Avoid Ambiguous Names**: Clear, specific element descriptions
- **Voice-Friendly Content**: Content structured for voice navigation

### 5.3 Timing Considerations

#### Time Limits
- **Extendable Timeouts**: User can request more time
- **No Rigid Time Limits**: Important interactions don't timeout
- **Warning Messages**: Advance notice before timeouts
- **User Control**: Users can control timing preferences

#### Motion Sensitivity
- **Reduced Motion**: Respects user's motion preferences
- **Animation Controls**: Users can disable animations
- **No Auto-Play**: Content doesn't auto-play without user action
- **Pause Options**: All animations can be paused or stopped

---

## 6. Cognitive Accessibility

### 6.1 Clear Language

#### Simple and Direct
- **Plain Language**: Clear, simple language throughout
- **Short Sentences**: Average sentence length kept short
- **Common Words**: Prefer common vocabulary over jargon
- **Active Voice**: Active voice construction for clarity

#### Instructions and Help
- **Step-by-Step**: Clear, numbered instructions
- **Contextual Help**: Help available where needed
- **Examples**: Practical examples for guidance
- **Error Recovery**: Clear instructions for error recovery

### 6.2 Consistent Interface

#### Predictable Patterns
- **Navigation Consistency**: Same navigation across all pages
- **Interaction Patterns**: Consistent interaction methods
- **Visual Consistency**: Uniform design language
- **Functional Consistency**: Similar features work similarly

#### User Control
- **Customizable Interface**: Users can adjust interface to needs
- **Undo Functionality**: Users can reverse actions
- **Progress Indicators**: Clear indication of current status
- **Confirmation Dialogs**: Important actions require confirmation

### 6.3 Error Prevention and Recovery

#### Error Prevention
- **Input Validation**: Real-time validation prevents errors
- **Clear Labels**: Descriptive labels prevent confusion
- **Required Fields**: Clear indication of required information
- **Format Examples**: Examples show expected format

#### Error Recovery
- **Clear Error Messages**: Specific, actionable error descriptions
- **How to Fix**: Instructions on resolving errors
- **Undo Options**: Ability to reverse recent actions
- **Help Resources**: Access to help when errors occur

---

## 7. Assistive Technology Setup

### 7.1 Screen Reader Setup

#### NVDA Setup (Windows)
1. **Download NVDA**: Free screen reader from nvaccess.org
2. **Install NVDA**: Follow installation wizard
3. **Configure Browser**: Enable accessibility in browser settings
4. **Test Navigation**: Use Tab, arrow keys, and NVDA commands

#### VoiceOver Setup (macOS/iOS)
1. **Enable VoiceOver**: System Preferences → Accessibility → VoiceOver
2. **Configure VoiceOver**: Adjust speaking rate and verbosity
3. **Keyboard Navigation**: Practice VoiceOver keyboard commands
4. **Test Application**: Navigate through application features

#### TalkBack Setup (Android)
1. **Enable TalkBack**: Settings → Accessibility → TalkBack
2. **Configure Settings**: Adjust speech rate and feedback
3. **Practice Gestures**: Learn TalkBack gesture navigation
4. **Test Mobile App**: Use TalkBack with mobile interface

### 7.2 Browser Accessibility Settings

#### Chrome Accessibility
1. **Open Settings**: chrome://settings/accessibility
2. **Configure Options**:
   - High contrast mode
   - Larger fonts
   - Keyboard navigation highlights
   - Managed extensions

#### Firefox Accessibility
1. **Open Preferences**: about:preferences#accessibility
2. **Configure Options**:
   - Always use the cursor key in dropdown lists
   - Warn me when websites try to redirect or reload
   - Reduce motion settings

#### Safari Accessibility
1. **Open Preferences**: Safari → Preferences → Advanced
2. **Configure Options**:
   - Never use fonts smaller than
   - Press Tab to highlight each item on a webpage
   - Accessibility features in macOS

### 7.3 Third-Party Tools

#### Magnification Tools
- **ZoomText**: Windows magnification and screen reading
- **MAGic**: Windows magnification software
- **Built-in Magnifiers**: System magnifiers on all platforms

#### Alternative Input
- **Dragon NaturallySpeaking**: Voice recognition software
- **Switch Control**: iOS and macOS switch control
- **Eye Tracking**: Tobii and other eye-tracking solutions

---

## 8. Browser Accessibility Settings

### 8.1 Text and Font Settings

#### Font Size Adjustment
1. **Zoom Controls**: Ctrl/Cmd + Plus/Minus for zoom
2. **Default Font Size**: Browser settings for base font size
3. **Minimum Font Size**: Set minimum readable font size
4. **Custom Fonts**: Select preferred fonts for readability

#### Text Customization
- **Font Family**: Choose readable sans-serif fonts
- **Line Height**: Adjust for comfortable reading
- **Letter Spacing**: Increase spacing if needed
- **Word Spacing**: Adjust spacing between words

### 8.2 Color and Contrast Settings

#### High Contrast Mode
1. **Enable High Contrast**: System accessibility settings
2. **Browser High Contrast**: Browser-specific settings
3. **Custom Color Schemes**: User-defined color combinations
4. **Inverted Colors**: Reverse color scheme option

#### Color Customization
- **Text Color**: Adjust for readability
- **Background Color**: Choose comfortable backgrounds
- **Link Colors**: Distinct colors for links
- **Error Colors**: Clear indication of errors

### 8.3 Motion and Animation Settings

#### Reduced Motion
1. **System Setting**: Respect prefers-reduced-motion
2. **Browser Setting**: Disable animations in browser
3. **Application Setting**: Toggle motion in app preferences
4. **Per-Site Setting**: Disable motion for specific sites

#### Animation Control
- **Disable Auto-Play**: Stop automatic animations
- **Pause Animations**: Manual control over animations
- **Speed Control**: Adjust animation speed
- **Motion Threshold**: Set minimum motion for animation

---

## 9. Troubleshooting Accessibility Issues

### 9.1 Common Issues

#### Screen Reader Not Working
**Symptoms**: Screen reader doesn't announce content
**Solutions**:
1. **Check screen reader** is enabled and running
2. **Verify browser** accessibility support
3. **Test with different** screen reader
4. **Check browser** JavaScript is enabled
5. **Update screen reader** to latest version

#### Keyboard Navigation Broken
**Symptoms**: Tab key doesn't move through elements
**Solutions**:
1. **Check browser** tab order settings
2. **Verify no modals** are blocking focus
3. **Test different browser** for comparison
4. **Check for JavaScript** errors in console
5. **Disable browser** extensions temporarily

#### Focus Indicators Missing
**Symptoms**: Can't see which element is focused
**Solutions**:
1. **Enable high contrast** mode in browser
2. **Check browser** accessibility settings
3. **Update browser** to latest version
4. **Test on different** operating system
5. **Use external focus** indicator tools

#### Text Too Small or Large
**Symptoms**: Text unreadable or poorly formatted
**Solutions**:
1. **Adjust browser** zoom level
2. **Change default** font size in browser
3. **Use browser** text size settings
4. **Enable browser** text scaling
5. **Try different** browser for comparison

### 9.2 Browser-Specific Issues

#### Chrome Issues
**Problem**: Accessibility features not working
**Solutions**:
1. **Update Chrome** to latest version
2. **Enable accessibility** in Chrome settings
3. **Clear Chrome** cache and cookies
4. **Reset Chrome** settings to default
5. **Disable extensions** that might interfere

#### Firefox Issues
**Problem**: Screen reader compatibility issues
**Solutions**:
1. **Update Firefox** to latest version
2. **Enable accessibility** features in Firefox
3. **Check Firefox** accessibility preferences
4. **Try Firefox** Safe Mode for testing
5. **Reset Firefox** accessibility settings

#### Safari Issues
**Problem**: VoiceOver navigation problems
**Solutions**:
1. **Update macOS/iOS** to latest version
2. **Configure VoiceOver** settings properly
3. **Check Safari** accessibility preferences
4. **Restart VoiceOver** and Safari
5. **Test with other** websites for comparison

### 9.3 Operating System Issues

#### Windows Issues
**Problem**: Built-in magnifier not working with app
**Solutions**:
1. **Check Windows** Magnifier settings
2. **Update Windows** to latest version
3. **Configure Windows** accessibility settings
4. **Test with different** browsers
5. **Update display** drivers

#### macOS Issues
**Problem**: VoiceOver conflicts with application
**Solutions**:
1. **Update macOS** to latest version
2. **Configure VoiceOver** preferences
3. **Check System** accessibility settings
4. **Restart VoiceOver** service
5. **Test with different** user accounts

#### Mobile Issues
**Problem**: TalkBack not working properly on mobile
**Solutions**:
1. **Update Android/iOS** to latest version
2. **Configure TalkBack/VoiceOver** settings
3. **Check mobile** browser accessibility support
4. **Restart device** and try again
5. **Test with different** mobile browsers

---

## 10. Feedback and Support

### 10.1 Accessibility Feedback

#### Reporting Issues
When reporting accessibility issues, include:
- **Screen reader name and version**
- **Browser name and version**
- **Operating system details**
- **Specific steps to reproduce**
- **Expected vs. actual behavior**
- **Screenshots or recordings** (if possible)

#### Feature Requests
For accessibility feature requests:
- **Describe the need** clearly
- **Explain how it helps** users with disabilities
- **Suggest implementation** if you have ideas
- **Priority level** (critical, important, nice-to-have)

### 10.2 Accessibility Testing

#### Self-Testing Checklist
- [ ] **Keyboard Navigation**: All features accessible via keyboard
- [ ] **Screen Reader**: Content announced correctly
- [ ] **High Contrast**: Interface visible in high contrast mode
- [ ] **Zoom**: Interface functional at 200% zoom
- [ ] **Color Independence**: Information not conveyed by color alone
- [ ] **Focus Management**: Clear focus indicators and logical order

#### Testing Tools
- **WAVE**: Web accessibility evaluation tool
- **axe**: Accessibility testing browser extension
- **Lighthouse**: Built-in Chrome accessibility audit
- **Colour Contrast Analyser**: Color contrast checking tool

### 10.3 Professional Support

#### Accessibility Consultation
- **Expert Review**: Professional accessibility assessment
- **Remediation Planning**: Structured approach to fixes
- **Training Resources**: Staff training on accessibility
- **Compliance Verification**: WCAG compliance confirmation

#### Ongoing Support
- **Regular Audits**: Periodic accessibility testing
- **Update Reviews**: Accessibility impact of changes
- **User Testing**: Testing with actual users with disabilities
- **Continuous Improvement**: Ongoing accessibility enhancements

---

## 📚 Additional Resources

### Accessibility Standards
- **WCAG 2.1 Guidelines**: www.w3.org/WAI/WCAG21/quickref/
- **Section 508**: www.section508.gov
- **EN 301 549**: European accessibility standard
- **ADA Guidelines**: Americans with Disabilities Act guidance

### Assistive Technology Resources
- **NVDA Screen Reader**: www.nvaccess.org
- **JAWS Screen Reader**: www.freedomscientific.com
- **VoiceOver Guide**: support.apple.com/guide/voiceover/
- **TalkBack Setup**: support.google.com/accessibility/android/

### Testing and Tools
- **WebAIM**: Web accessibility resources and tools
- **A11y Project**: Community-driven accessibility resources
- **Inclusive Design Patterns**: Universal design patterns
- **Accessibility Developer Guide**: Practical implementation guide

### Legal and Compliance
- **EU Accessibility Act**: Digital accessibility requirements
- **Dutch Accessibility Act**: Netherlands accessibility laws
- **EN 301 549 Compliance**: European standard compliance
- **WCAG Certification**: Accessibility certification programs

---

**Accessibility Guide Version**: 1.0.0  
**Last Updated**: December 2025  
**Compliance Standard**: WCAG 2.1 AA  
**Languages**: English, Dutch  
**Review Frequency**: Annually or when standards update