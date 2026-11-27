#!/usr/bin/env python3
"""
Build Wordyssey H5P packages (.h5p) for Lumi Cloud, Lumi Desktop, and LMS platforms.

Produces:
  1. h5p/wordyssey-course-presentation.h5p
     Official H5P.CoursePresentation 1.26 package (NOT Tabs) containing slides,
     Wordyssey artwork, interactive vocabulary flashcards & quizzes, and clickable
     H5P.Link buttons pointing to the hosted HTML5 game on GitHub Pages.
     Compatible with BOTH Lumi Cloud (app.lumi.education) and Lumi Desktop.

  2. h5p/wordyssey-iframe-embed.h5p
     Official H5P.IFrameEmbed 1.0 package embedding the playable Wordyssey HTML5
     game (self-contained offline HTML5 bundle by default, or external GitHub Pages
     URL when --iframe-url is passed). Designed for Lumi Desktop / LMS IFrameEmbed.

Usage:
  python scripts/build_h5p.py
  python scripts/build_h5p.py --url https://username.github.io/wordyssey/
"""

import argparse
import json
import os
import struct
import urllib.request
import uuid
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
H5P_DIR = ROOT / "h5p"
ASSETS_DIR = H5P_DIR / "assets"

HUB_CP_URL = "https://api.h5p.org/v1/content-types/H5P.CoursePresentation"
HUB_IF_URL = "https://api.h5p.org/v1/content-types/H5P.IFrameEmbed"
HUB_GM_URL = "https://api.h5p.org/v1/content-types/H5P.GameMap"

DEFAULT_GAME_URL = "https://your-username.github.io/wordyssey/"

VOCAB_ITEMS = [
    ("apple", "Food", "What is this delicious fruit?", "apple", ["apple", "banana", "orange", "grape"], "A sweet crisp red or green fruit that grows on trees."),
    ("star", "Objects", "What shines brightly in the sky?", "star", ["star", "moon", "sun", "cloud"], "A glowing celestial body — collect 10 in every Wordyssey stage!"),
    ("dog", "Animals", "Who is Wordi the friendly puppy?", "dog", ["dog", "cat", "rabbit", "bear"], "Wordi is a cheerful Shiba Inu companion on an English adventure."),
    ("book", "Objects", "You read stories in a...", "book", ["book", "table", "chair", "pen"], "Bound pages filled with stories, vocabulary, and knowledge."),
    ("castle", "Places", "A kingdom has a majestic...", "castle", ["castle", "tent", "bridge", "boat"], "A fortified stone stronghold — featured in Stage 3: Adventure Peaks!"),
    ("heart", "Objects", "Symbol of health and love:", "heart", ["heart", "star", "circle", "square"], "Represents Wordi's health points (HP) and affection."),
    ("car", "Places", "A motor vehicle with four wheels:", "car", ["car", "boat", "plane", "rocket"], "A road vehicle with four wheels for travel."),
    ("pizza", "Food", "Baked Italian dough with cheese:", "pizza", ["pizza", "apple", "salad", "soup"], "Flat baked dough topped with tomato sauce, melted cheese, and toppings."),
    ("tree", "Objects", "Tall plant with a trunk and leaves:", "tree", ["tree", "flower", "grass", "bush"], "A tall woody plant found across Stage 1: Basic Island."),
    ("sun", "Objects", "The star at the center of our solar system:", "sun", ["sun", "moon", "star", "comet"], "Shines bright in the sky above Wordi's floating islands."),
    ("cat", "Animals", "A furry companion that purrs:", "cat", ["cat", "dog", "cow", "lion"], "A small, agile domestic feline."),
    ("wave", "Places", "Ocean water that rises and curls:", "wave", ["wave", "wind", "stone", "fire"], "Moving ocean swell surrounding the 5 floating islands."),
]


def new_id() -> str:
    return str(uuid.uuid4())


def png_size(data: bytes) -> tuple[int, int]:
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("Expected PNG image")
    w, h = struct.unpack(">II", data[16:24])
    return w, h


def split_url(url: str) -> tuple[str, str]:
    u = url.strip()
    if u.startswith("https://"):
        return "https://", u[len("https://"):]
    if u.startswith("http://"):
        return "http://", u[len("http://"):]
    if u.startswith("/"):
        return "/", u[1:]
    return "https://", u


def make_shape(x, y, w, h, fill="#17161d", border="#f4efe6", bw="2", radius="3", opacity=0):
    return {
        "x": x,
        "y": y,
        "width": w,
        "height": h,
        "action": {
            "library": "H5P.Shape 1.0",
            "params": {
                "type": "rectangle",
                "shape": {
                    "fillColor": fill,
                    "borderColor": border,
                    "borderWidth": str(bw),
                    "borderStyle": "solid",
                    "borderRadius": str(radius),
                },
                "line": {
                    "borderColor": border,
                    "borderWidth": "1",
                    "borderStyle": "solid",
                },
            },
            "subContentId": new_id(),
            "metadata": {"contentType": "Shapes", "license": "U"},
        },
        "backgroundOpacity": opacity,
        "displayAsButton": False,
        "buttonSize": "big",
        "goToSlideType": "specified",
        "invisible": False,
    }


def make_text(x, y, w, h, html, opacity=0):
    return {
        "x": x,
        "y": y,
        "width": w,
        "height": h,
        "action": {
            "library": "H5P.AdvancedText 1.1",
            "params": {"text": html},
            "subContentId": new_id(),
            "metadata": {"contentType": "Text", "license": "U", "title": "Text"},
        },
        "alwaysDisplayComments": False,
        "backgroundOpacity": opacity,
        "displayAsButton": False,
        "buttonSize": "big",
        "goToSlideType": "specified",
        "invisible": False,
        "solution": "",
    }


def make_link(x, y, w, h, title, full_url, display_as_button=False, opacity=100):
    proto, rest = split_url(full_url)
    return {
        "x": x,
        "y": y,
        "width": w,
        "height": h,
        "action": {
            "library": "H5P.Link 1.3",
            "params": {
                "title": title,
                "linkWidget": {
                    "protocol": proto,
                    "url": rest,
                },
            },
            "subContentId": new_id(),
            "metadata": {"contentType": "Link", "license": "U", "title": title},
        },
        "alwaysDisplayComments": False,
        "backgroundOpacity": opacity,
        "displayAsButton": display_as_button,
        "buttonSize": "big",
        "goToSlideType": "specified",
        "invisible": False,
        "solution": "",
    }


def make_goto_hotspot(x, y, w, h, slide_num, title):
    return {
        "x": x,
        "y": y,
        "width": w,
        "height": h,
        "alwaysDisplayComments": False,
        "backgroundOpacity": 0,
        "displayAsButton": False,
        "buttonSize": "big",
        "title": title,
        "goToSlideType": "specified",
        "goToSlide": slide_num,
        "invisible": False,
        "solution": "",
    }


def make_image(x, y, w, h, rel_path, img_w, img_h, alt, title=""):
    return {
        "x": x,
        "y": y,
        "width": w,
        "height": h,
        "action": {
            "library": "H5P.Image 1.1",
            "params": {
                "file": {
                    "path": rel_path,
                    "mime": "image/png",
                    "copyright": {"license": "U"},
                    "width": img_w,
                    "height": img_h,
                },
                "decorative": False,
                "alt": alt,
                "title": title or alt,
                "contentName": "Image",
                "expandImage": "Expand Image",
                "minimizeImage": "Minimize Image",
            },
            "subContentId": new_id(),
            "metadata": {"contentType": "Image", "license": "U", "title": title or alt},
        },
        "alwaysDisplayComments": False,
        "backgroundOpacity": 0,
        "displayAsButton": False,
        "buttonSize": "big",
        "goToSlideType": "specified",
        "invisible": False,
        "solution": "",
    }


def make_multichoice(x, y, w, h, question_html, correct_word, choices, clue_desc):
    answers = []
    for ch in choices:
        is_ok = ch == correct_word
        answers.append({
            "text": f"<p><strong>{ch.capitalize()}</strong></p>",
            "correct": is_ok,
            "tipsAndFeedback": {
                "tip": "",
                "chosenFeedback": (
                    f"<p>Great job! <strong>{ch.capitalize()}</strong> is correct. {clue_desc}</p>"
                    if is_ok
                    else f"<p>Not quite — look closely at the illustration clue and try again!</p>"
                ),
                "notChosenFeedback": "",
            },
        })

    return {
        "x": x,
        "y": y,
        "width": w,
        "height": h,
        "action": {
            "library": "H5P.MultiChoice 1.16",
            "params": {
                "media": {"disableImageZooming": False},
                "question": f"<p><strong>{question_html}</strong></p>",
                "answers": answers,
                "overallFeedback": [
                    {"from": 0, "to": 99, "feedback": "Keep exploring! Review the clue image and try again."},
                    {"from": 100, "to": 100, "feedback": "Spot on! +10 Word Coins earned in Wordyssey!"},
                ],
                "behaviour": {
                    "enableRetry": True,
                    "enableSolutionsButton": True,
                    "enableCheckButton": True,
                    "type": "single",
                    "singlePoint": False,
                    "randomAnswers": True,
                    "showSolutionsRequiresInput": True,
                    "confirmCheckDialog": False,
                    "confirmRetryDialog": False,
                    "autoCheck": False,
                    "passPercentage": 100,
                    "showScorePoints": True,
                },
                "UI": {
                    "checkAnswerButton": "Check",
                    "showSolutionButton": "Show solution",
                    "tryAgainButton": "Retry",
                    "tipsLabel": "Show tip",
                    "scoreBarLabel": "You got :num out of :total points",
                    "tipAvailable": "Tip available",
                    "feedbackAvailable": "Feedback available",
                    "readFeedback": "Read feedback",
                    "wrongAnswer": "Wrong answer",
                    "correctAnswer": "Correct answer",
                    "shouldCheck": "Should have been checked",
                    "shouldNotCheck": "Should not have been checked",
                    "noInput": "Please answer before viewing the solution",
                    "submitAnswerButton": "Submit",
                    "a11yCheck": "Check the answers. The responses will be marked as correct, incorrect, or unanswered.",
                    "a11yShowSolution": "Show the solution. The task will be marked with its correct solution.",
                    "a11yRetry": "Retry the task. Reset all responses and start the task over again.",
                },
                "confirmCheck": {
                    "header": "Finish ?",
                    "body": "Are you sure you wish to finish ?",
                    "cancelLabel": "Cancel",
                    "confirmLabel": "Finish",
                },
                "confirmRetry": {
                    "header": "Retry ?",
                    "body": "Are you sure you wish to retry ?",
                    "cancelLabel": "Cancel",
                    "confirmLabel": "Confirm",
                },
            },
            "subContentId": new_id(),
            "metadata": {"contentType": "Multiple Choice", "license": "U", "title": f"Word Check: {correct_word.capitalize()}"},
        },
        "alwaysDisplayComments": False,
        "backgroundOpacity": 100,
        "displayAsButton": False,
        "buttonSize": "big",
        "goToSlideType": "specified",
        "invisible": False,
        "solution": f"<p>The correct word is <strong>{correct_word}</strong>.</p>",
    }


def make_dialogcards(x, y, w, h, image_dims):
    dialogs = []
    for word, topic, prompt, answer, _choices, desc in VOCAB_ITEMS:
        iw, ih = image_dims[f"clue-{word}.png"]
        dialogs.append({
            "text": f'<p style="text-align: center;"><strong>[{topic}]</strong><br>{prompt}</p>',
            "answer": f'<p style="text-align: center;"><strong>{answer.upper()}</strong><br>{desc}</p>',
            "image": {
                "path": f"images/clue-{word}.png",
                "mime": "image/png",
                "copyright": {"license": "U"},
                "width": iw,
                "height": ih,
            },
            "imageAltText": f"Wordyssey clue illustration for {word}",
            "tips": {
                "front": f"Starts with '{answer[0].upper()}' ({len(answer)} letters)",
                "back": f"Category: {topic}",
            },
        })

    return {
        "x": x,
        "y": y,
        "width": w,
        "height": h,
        "action": {
            "library": "H5P.Dialogcards 1.9",
            "params": {
                "title": "",
                "mode": "normal",
                "description": "",
                "dialogs": dialogs,
                "behaviour": {
                    "enableRetry": True,
                    "disableBackwardsNavigation": False,
                    "scaleTextNotCard": False,
                    "randomCards": False,
                    "maxProficiency": 5,
                    "quickProgression": False,
                },
                "answer": "Turn",
                "next": "Next",
                "prev": "Previous",
                "retry": "Retry",
                "correctAnswer": "I got it right!",
                "incorrectAnswer": "I got it wrong",
                "round": "Round @round",
                "cardsLeft": "Cards left: @number",
                "nextRound": "Proceed to round @round",
                "startOver": "Start over",
                "showSummary": "Next",
                "summary": "Summary",
                "summaryCardsRight": "Cards you got right:",
                "summaryCardsWrong": "Cards you got wrong:",
                "summaryCardsNotShown": "Cards in pool not shown:",
                "summaryOverallScore": "Overall Score",
                "summaryCardsCompleted": "Cards you have completed learning:",
                "summaryCompletedRounds": "Completed rounds:",
                "summaryAllDone": "Well done! You got all @cards cards correct @max times in a row!",
                "progressText": "Card @card of @total",
                "cardFrontLabel": "Card front",
                "cardBackLabel": "Card back",
                "tipButtonLabel": "Show tip",
                "audioNotSupported": "Your browser does not support this audio",
                "confirmStartingOver": {
                    "header": "Start over?",
                    "body": "All progress will be lost. Are you sure you want to start over?",
                    "cancelLabel": "Cancel",
                    "confirmLabel": "Start over",
                },
            },
            "subContentId": new_id(),
            "metadata": {"contentType": "Dialog Cards", "license": "U", "title": "Wordyssey Flashcards"},
        },
        "alwaysDisplayComments": False,
        "backgroundOpacity": 0,
        "displayAsButton": True,
        "buttonSize": "big",
        "goToSlideType": "specified",
        "invisible": False,
        "solution": "",
    }


def make_single_choice_set(x, y, w, h, item_ids):
    by_id = {it[0]: it for it in VOCAB_ITEMS}
    choices_list = []
    for wid in item_ids:
        _w, topic, prompt, answer, choices, _desc = by_id[wid]
        ordered = [answer] + [c for c in choices if c != answer]
        choices_list.append({
            "subContentId": new_id(),
            "question": f"<p><strong>[{topic}]</strong> {prompt}</p>",
            "answers": [f"<p>{c.capitalize()}</p>" for c in ordered],
        })

    return {
        "x": x,
        "y": y,
        "width": w,
        "height": h,
        "action": {
            "library": "H5P.SingleChoiceSet 1.11",
            "params": {
                "choices": choices_list,
                "overallFeedback": [
                    {"from": 0, "to": 49, "feedback": "Keep practicing with Wordi! Review the flashcards on Slide 4."},
                    {"from": 50, "to": 89, "feedback": "Nice work! You're ready for the Word Odyssey islands."},
                    {"from": 90, "to": 100, "feedback": "Champion! Wordi salutes your English mastery!"},
                ],
                "behaviour": {
                    "autoContinue": True,
                    "timeoutCorrect": 1400,
                    "timeoutWrong": 2200,
                    "soundEffectsEnabled": True,
                    "enableRetry": True,
                    "enableSolutionsButton": True,
                    "passPercentage": 70,
                },
                "l10n": {
                    "nextButtonLabel": "Next question",
                    "showSolutionButtonLabel": "Show solution",
                    "retryButtonLabel": "Retry",
                    "solutionViewTitle": "Solution list",
                    "correctText": "Correct!",
                    "incorrectText": "Incorrect!",
                    "muteButtonLabel": "Mute feedback sound",
                    "closeButtonLabel": "Close",
                    "slideOfTotal": "Slide :num of :total",
                    "scoreBarLabel": "You got :num out of :total points",
                    "solutionListQuestionNumber": "Question :num",
                    "a11yShowSolution": "Show the solution. The task will be marked with its correct solution.",
                    "a11yRetry": "Retry the task. Reset all responses and start the task over again.",
                    "shouldSelect": "Should have been selected",
                    "shouldNotSelect": "Should not have been selected",
                },
            },
            "subContentId": new_id(),
            "metadata": {"contentType": "Single Choice Set", "license": "U", "title": "Wordyssey Speed Challenge"},
        },
        "alwaysDisplayComments": False,
        "backgroundOpacity": 100,
        "displayAsButton": False,
        "buttonSize": "big",
        "goToSlideType": "specified",
        "invisible": False,
        "solution": "",
    }


def build_course_presentation_shell(slides: list[dict], title: str = "Course Presentation") -> dict:
    return {
        "library": "H5P.CoursePresentation 1.26",
        "params": {
            "presentation": {
                "slides": slides,
                "keywordListEnabled": True,
                "keywordListAlwaysShow": False,
                "keywordListAutoHide": True,
                "keywordListOpacity": 90,
                "globalBackgroundSelector": {},
            },
            "override": {
                "activeSurface": False,
                "hideSummarySlide": False,
                "enablePrintButton": False,
                "social": {
                    "showFacebookShare": False,
                    "facebookShare": {
                        "url": "@currentpageurl",
                        "quote": "I scored @score out of @maxScore on Wordyssey!",
                    },
                    "showTwitterShare": False,
                    "twitterShare": {
                        "statement": "I scored @score out of @maxScore on Wordyssey!",
                        "url": "@currentpageurl",
                        "hashtags": "wordyssey,h5p,english",
                    },
                    "showGoogleShare": False,
                    "googleShareUrl": "@currentpageurl",
                },
                "summarySlideSolutionButton": True,
                "summarySlideRetryButton": True,
            },
            "l10n": {
                "slide": "Slide",
                "score": "Score",
                "yourScore": "Your Score",
                "maxScore": "Max Score",
                "total": "Total",
                "totalScore": "Total Score",
                "showSolutions": "Show solutions",
                "retry": "Retry",
                "exportAnswers": "Export text",
                "hideKeywords": "Hide sidebar navigation menu",
                "showKeywords": "Show sidebar navigation menu",
                "fullscreen": "Fullscreen",
                "exitFullscreen": "Exit fullscreen",
                "prevSlide": "Previous slide",
                "nextSlide": "Next slide",
                "currentSlide": "Current slide",
                "lastSlide": "Last slide",
                "solutionModeTitle": "Exit solution mode",
                "solutionModeText": "Solution Mode",
                "summaryMultipleTaskText": "Multiple tasks",
                "scoreMessage": "You achieved:",
                "shareFacebook": "Share on Facebook",
                "shareTwitter": "Share on Twitter",
                "shareGoogle": "Share on Google+",
                "summary": "Summary",
                "solutionsButtonTitle": "Show comments",
                "printTitle": "Print",
                "printIngress": "How would you like to print this presentation?",
                "printAllSlides": "Print all slides",
                "printCurrentSlide": "Print current slide",
                "noTitle": "No title",
                "accessibilitySlideNavigationExplanation": "Use left and right arrow to change slide in that direction whenever canvas is selected.",
                "accessibilityCanvasLabel": "Presentation canvas. Use left and right arrow to move between slides.",
                "accessibilityProgressBarLabel": "Choose slide to display",
                "containsNotCompleted": "@slideName contains not completed interaction",
                "containsCompleted": "@slideName contains completed interaction",
                "slideCount": "Slide @index of @total",
                "containsOnlyCorrect": "@slideName only has correct answers",
                "containsIncorrectAnswers": "@slideName has incorrect answers",
                "shareResult": "Share Result",
                "accessibilityTotalScore": "You got @score of @maxScore points in total",
                "accessibilityEnteredFullscreen": "Entered fullscreen",
                "accessibilityExitedFullscreen": "Exited fullscreen",
                "confirmDialogHeader": "Submit your answers",
                "confirmDialogText": "This will submit your results, do you want to continue?",
                "confirmDialogConfirmText": "Submit and see results",
                "slideshowNavigationLabel": "Slideshow navigation",
                "confirmDialogConfirmLabel": "Confirm",
                "confirmDialogCancelLabel": "Cancel",
            },
        },
        "subContentId": new_id(),
        "metadata": {"contentType": "Course Presentation", "license": "U", "title": title},
    }


def make_dragtext(task_desc: str, text_field: str, title: str) -> dict:
    return {
        "library": "H5P.DragText 1.10",
        "params": {
            "media": {"disableImageZooming": False},
            "taskDescription": f"<p>{task_desc}</p>",
            "overallFeedback": [
                {"from": 0, "to": 99, "feedback": "Try matching the remaining English clues with Wordi!"},
                {"from": 100, "to": 100, "feedback": "Excellent! All Wordyssey vocabulary matched!"},
            ],
            "checkAnswer": "Check",
            "submitAnswer": "Submit",
            "tryAgain": "Retry",
            "showSolution": "Show solution",
            "dropZoneIndex": "Drop Zone @index.",
            "empty": "Drop Zone @index is empty.",
            "contains": "Drop Zone @index contains draggable @draggable.",
            "ariaDraggableIndex": "@index of @count draggables.",
            "tipLabel": "Show tip",
            "correctText": "Correct!",
            "incorrectText": "Incorrect!",
            "resetDropTitle": "Reset drop",
            "resetDropDescription": "Are you sure you want to reset this drop zone?",
            "grabbed": "Draggable is grabbed.",
            "cancelledDragging": "Cancelled dragging.",
            "correctAnswer": "Correct answer:",
            "feedbackHeader": "Feedback",
            "behaviour": {
                "enableRetry": True,
                "enableSolutionsButton": True,
                "enableCheckButton": True,
                "instantFeedback": False,
            },
            "scoreBarLabel": "You got :num out of :total points",
            "a11yCheck": "Check the answers. The responses will be marked as correct, incorrect, or unanswered.",
            "a11yShowSolution": "Show the solution. The task will be marked with its correct solution.",
            "a11yRetry": "Retry the task. Reset all responses and start the task over again.",
            "textField": text_field,
        },
        "subContentId": new_id(),
        "metadata": {"contentType": "Drag the Words", "license": "U", "title": title},
    }


def make_truefalse(question: str, is_true: bool, img_name: str, alt: str, image_dims: dict, title: str) -> dict:
    iw, ih = image_dims[img_name]
    return {
        "library": "H5P.TrueFalse 1.8",
        "params": {
            "media": {
                "type": {
                    "library": "H5P.Image 1.1",
                    "params": {
                        "file": {
                            "path": f"images/{img_name}",
                            "mime": "image/png",
                            "copyright": {"license": "U"},
                            "width": iw,
                            "height": ih,
                        },
                        "decorative": False,
                        "alt": alt,
                        "title": alt,
                        "contentName": "Image",
                        "expandImage": "Expand Image",
                        "minimizeImage": "Minimize Image",
                    },
                    "subContentId": new_id(),
                    "metadata": {"contentType": "Image", "license": "U", "title": alt},
                },
                "disableImageZooming": False,
            },
            "correct": "true" if is_true else "false",
            "behaviour": {
                "enableRetry": True,
                "enableSolutionsButton": True,
                "enableCheckButton": True,
                "confirmCheckDialog": False,
                "confirmRetryDialog": False,
                "autoCheck": False,
            },
            "l10n": {
                "trueText": "True",
                "falseText": "False",
                "score": "You got @score of @total points",
                "checkAnswer": "Check",
                "showSolutionButton": "Show solution",
                "tryAgain": "Retry",
                "wrongAnswerMessage": "Wrong answer",
                "correctAnswerMessage": "Correct answer",
                "scoreBarLabel": "You got :num out of :total points",
                "submitAnswer": "Submit",
                "a11yCheck": "Check the answers. The responses will be marked as correct, incorrect, or unanswered.",
                "a11yShowSolution": "Show the solution. The task will be marked with its correct solution.",
                "a11yRetry": "Retry the task. Reset all responses and start the task over again.",
            },
            "confirmCheck": {"header": "Finish ?", "body": "<p>Are you sure you wish to finish ?</p>", "cancelLabel": "Cancel", "confirmLabel": "Finish"},
            "confirmRetry": {"header": "Retry ?", "body": "<p>Are you sure you wish to retry ?</p>", "cancelLabel": "Cancel", "confirmLabel": "Confirm"},
            "question": f"<p><strong>{question}</strong></p>",
        },
        "subContentId": new_id(),
        "metadata": {"contentType": "True/False Question", "license": "U", "title": title},
    }


def make_memorygame(words: list[str], image_dims: dict, title: str) -> dict:
    cards = []
    for w in words:
        iw, ih = image_dims[f"clue-{w}.png"]
        img_obj = {
            "path": f"images/clue-{w}.png",
            "mime": "image/png",
            "copyright": {"license": "U"},
            "width": iw,
            "height": ih,
        }
        cards.append({"image": img_obj, "match": img_obj, "imageAlt": f"Wordyssey clue: {w}"})
    return {
        "library": "H5P.MemoryGame 1.3",
        "params": {
            "cards": cards,
            "behaviour": {"useGrid": False, "allowRetry": True},
            "lookNFeel": {"themeColor": "#ff7a1a"},
            "l10n": {
                "cardTurns": "Card turns",
                "timeSpent": "Time spent",
                "feedback": "Great memory! Wordi found all vocabulary pairs!",
                "tryAgain": "Reset",
                "closeLabel": "Close",
                "label": "Wordyssey Memory Game. Find the matching vocabulary clue cards.",
                "done": "All of the cards have been found.",
                "cardPrefix": "Card %num:",
                "cardUnturned": "Unturned.",
                "cardMatched": "Match found.",
                "cardTurned": "Turned.",
                "cardMatchedA11y": "Your cards match!",
                "cardNotMatchedA11y": "Your chosen cards do not match. Turn other cards to try again.",
            },
        },
        "subContentId": new_id(),
        "metadata": {"contentType": "Memory Game", "license": "U", "title": title},
    }


def build_gamemap_content(game_url: str, image_dims: dict[str, tuple[int, int]]) -> dict:
    hw, hh = image_dims["wordi-hero.png"]
    mw, mh = image_dims.get("gamemap-bg.png", image_dims["world-map.png"])
    map_rel_path = "images/gamemap-bg.png" if "gamemap-bg.png" in image_dims else "images/world-map.png"
    tw, th = image_dims.get("gamemap-title.png", image_dims["wordi-hero.png"])
    title_rel_path = "images/gamemap-title.png" if "gamemap-title.png" in image_dims else "images/wordi-hero.png"
    ew, eh = image_dims["wordi-expressions.png"]
    aw, ah = image_dims["clue-apple.png"]

    # Stage 0 CoursePresentation (Intro + Controls + Launch Link to HTML5 Game)
    intro_slides = [
        {
            "keywords": [{"main": "Welcome & Launch Game"}],
            "slideBackgroundSelector": {"fillSlideBackground": "#0f0e13"},
            "elements": [
                make_shape(3, 5, 94, 90, fill="#17161d", border="#f4efe6", bw="2", radius="4"),
                make_image(6, 13, 27, 48, "images/wordi-hero.png", hw, hh, "Wordi the Inu mascot", "Wordi the Inu"),
                make_text(
                    36, 8, 58, 34,
                    '<h3><span style="color:#c6ff3d;">WORDYSSEY: ENGLISH ODYSSEY</span></h3>'
                    '<p><span style="color:#f4efe6;">Explore <strong>5 floating islands</strong>, complete English vocabulary activities, and launch the full HTML5 platformer!</span></p>'
                    '<p><span style="color:#ffd43b;"><em>"One word at a time, you can go a long way!"</em></span></p>',
                ),
                make_shape(36, 44, 58, 23, fill="#211f29", border="#c6ff3d", bw="2", radius="4"),
                make_text(38, 45.5, 54, 7.5, '<p><span style="color:#c6ff3d;"><strong>PLAY FULL HTML5 GAME (GITHUB PAGES)</strong></span></p>'),
                make_shape(38, 54, 54, 10, fill="#fff9ee", border="#c6ff3d", bw="2", radius="4"),
                make_link(39.5, 55.2, 51, 7.6, "Open Playable Wordyssey HTML5 Game", game_url, display_as_button=False, opacity=0),
                make_shape(36, 71, 58, 18, fill="#211f29", border="#ff7a1a", bw="2", radius="4"),
                make_text(38, 72.5, 54, 15, '<p><span style="color:#ff7a1a;"><strong>Next Slide →</strong></span> <span style="color:#f4efe6;">View controls, combat moves &amp; island mechanics, then close this window to unlock Island 1-3!</span></p>'),
            ],
        },
        {
            "keywords": [{"main": "Controls & Island Mechanics"}],
            "slideBackgroundSelector": {"fillSlideBackground": "#0f0e13"},
            "elements": [
                make_text(4, 4, 92, 11, '<h2><span style="color:#5ce1e6;">CONTROLS, COMBAT &amp; ISLAND MECHANICS</span></h2>'),
                make_shape(4, 17, 44, 76, fill="#17161d", border="#c6ff3d", bw="2", radius="3"),
                make_text(
                    6, 18.5, 40, 73,
                    '<h3><span style="color:#c6ff3d;">Wordi Controls</span></h3>'
                    '<ul>'
                    '<li><span style="font-size:0.875em;color:#f4efe6;"><strong>Move:</strong> <code>A / D</code> or <code>Left / Right</code></span></li>'
                    '<li><span style="font-size:0.875em;color:#f4efe6;"><strong>Jump / Double Jump:</strong> <code>W</code> or <code>Space</code></span></li>'
                    '<li><span style="font-size:0.875em;color:#f4efe6;"><strong>Bark Blast:</strong> <code>J</code> or <code>Left Click</code></span></li>'
                    '<li><span style="font-size:0.875em;color:#f4efe6;"><strong>Dash (i-frames):</strong> <code>Shift</code> or <code>K</code></span></li>'
                    '<li><span style="font-size:0.875em;color:#f4efe6;"><strong>Ground Pound:</strong> <code>S</code> in mid-air</span></li>'
                    '<li><span style="font-size:0.875em;color:#f4efe6;"><strong>Stomp:</strong> Land on slimes &amp; bats</span></li>'
                    '</ul>',
                ),
                make_shape(52, 17, 44, 76, fill="#17161d", border="#ff7a1a", bw="2", radius="3"),
                make_text(
                    54, 18.5, 40, 73,
                    '<h3><span style="color:#ff7a1a;">Stage Mechanics &amp; Chests</span></h3>'
                    '<ul>'
                    '<li><span style="font-size:0.875em;color:#f4efe6;"><strong>Mystery Word Chests:</strong> Solve clues for <strong>+500 pts</strong> &amp; Shield!</span></li>'
                    '<li><span style="font-size:0.875em;color:#f4efe6;"><strong>Bounce Pads &amp; Elevators:</strong> Reach high star rings.</span></li>'
                    '<li><span style="font-size:0.875em;color:#f4efe6;"><strong>Crumbling Planks:</strong> Shake and fall after 0.8s.</span></li>'
                    '<li><span style="font-size:0.875em;color:#f4efe6;"><strong>Ice &amp; Quantum Blocks:</strong> Time jumps across phase ledges.</span></li>'
                    '<li><span style="font-size:0.875em;color:#f4efe6;"><strong>Combos &amp; Speech:</strong> Web Audio + spoken pronunciation!</span></li>'
                    '</ul>',
                ),
            ],
        },
    ]

    # Stage 4 CoursePresentation (Wordi Character Sheet + Modes + HTML5 Game Link)
    adventure_slides = [
        {
            "keywords": [{"main": "Wordi Character Sheet"}],
            "slideBackgroundSelector": {"fillSlideBackground": "#0f0e13"},
            "elements": [
                make_text(4, 4, 92, 10, '<h2><span style="color:#ff7a1a;">MEET WORDI THE INU &amp; EXPRESSIONS</span></h2>'),
                make_image(4, 16, 92, 47, "images/wordi-expressions.png", ew, eh, "Wordi four expressions: Happy, Surprised, Sad, Excited", "Wordi Expressions"),
                make_shape(4, 66, 92, 26, fill="#17161d", border="#f4efe6", bw="2", radius="3"),
                make_text(
                    6, 68, 88, 22,
                    '<p><span style="color:#f4efe6;"><strong>Personality:</strong> Friendly, Cheerful, Adventurous companion in English discovery.</span></p>'
                    '<p><span style="color:#ffd43b;"><strong>Palette:</strong> Orange <code>#ff9533</code> · Cream <code>#fff4e0</code> · Blue <code>#0a84ff</code> · Pink <code>#ff9eaa</code></span></p>',
                ),
            ],
        },
        {
            "keywords": [{"main": "Difficulty & Play HTML5"}],
            "slideBackgroundSelector": {"fillSlideBackground": "#0f0e13"},
            "elements": [
                make_text(4, 4, 92, 10, '<h2><span style="color:#c6ff3d;">DIFFICULTY MODES &amp; LIVE HTML5 GAME</span></h2>'),
                make_shape(4, 17, 92, 42, fill="#17161d", border="#f4efe6", bw="2", radius="3"),
                make_text(
                    6, 19, 88, 38,
                    '<ul>'
                    '<li><span style="color:#c6ff3d;"><strong>Casual:</strong></span> <span style="color:#f4efe6;">4 Hearts · 2.4s Invulnerability · 0.75x Enemy Speed · 16s Quiz · 1.0x Score</span></li>'
                    '<li><span style="color:#5ce1e6;"><strong>Normal:</strong></span> <span style="color:#f4efe6;">3 Hearts · 1.6s Invulnerability · Standard Pace · 12s Quiz · 1.25x Score</span></li>'
                    '<li><span style="color:#ff7a1a;"><strong>Hero:</strong></span> <span style="color:#f4efe6;">2 Hearts · 1.0s Invulnerability · 1.35x Fast Enemies · 8s Quiz · 2.0x Score!</span></li>'
                    '</ul>',
                ),
                make_shape(4, 64, 92, 26, fill="#211f29", border="#c6ff3d", bw="2", radius="4"),
                make_text(6, 67, 46, 18, '<p><span style="color:#f4efe6;">Ready to battle the <strong>Word Titan Boss</strong> in Stage 5? Launch the full game:</span></p>'),
                make_shape(54, 69, 39, 15, fill="#fff9ee", border="#c6ff3d", bw="2", radius="4"),
                make_link(55.5, 71.5, 36, 10, "Launch Wordyssey HTML5 Game", game_url, display_as_button=False, opacity=0),
            ],
        },
    ]

    mc_apple = make_multichoice(0, 0, 100, 100, "What is this delicious fruit?", "apple", ["apple", "banana", "orange", "grape"], "A sweet crisp red or green fruit that grows on trees.")["action"]
    mc_apple["params"]["media"] = {
        "type": {
            "library": "H5P.Image 1.1",
            "params": {
                "file": {"path": "images/clue-apple.png", "mime": "image/png", "copyright": {"license": "U"}, "width": aw, "height": ah},
                "decorative": False,
                "alt": "Red apple clue illustration",
                "title": "Apple",
                "contentName": "Image",
                "expandImage": "Expand Image",
                "minimizeImage": "Minimize Image",
            },
            "subContentId": new_id(),
            "metadata": {"contentType": "Image", "license": "U", "title": "Apple"},
        },
        "disableImageZooming": False,
    }

    def stage_node(label, cx, cy, neighbors, content_item, is_start=False):
        return {
            "id": new_id(),
            "type": "stage",
            "label": label,
            "canBeStartStage": is_start,
            "time": {},
            "accessRestrictions": {"allOrAnyRestrictionSet": "all", "restrictionSetList": []},
            "specialStageExtraLives": 1,
            "specialStageExtraTime": 1,
            "neighbors": neighbors,
            "telemetry": {
                "x": str(round(cx - 2.1875, 4)),
                "y": str(round(cy - 3.888889, 4)),
                "width": "4.375",
                "height": "7.777777777777778",
            },
            "contentsList": [{"contentType": content_item}],
        }

    def special_node(label, cx, cy, neighbors, special_type, link_url=None):
        node = {
            "id": new_id(),
            "type": "special-stage",
            "label": label,
            "canBeStartStage": False,
            "time": {},
            "accessRestrictions": {"allOrAnyRestrictionSet": "all", "restrictionSetList": []},
            "specialStageType": special_type,
            "specialStageExtraLives": 1,
            "specialStageExtraTime": 1,
            "neighbors": neighbors,
            "telemetry": {
                "x": str(round(cx - 2.1875, 4)),
                "y": str(round(cy - 3.888889, 4)),
                "width": "4.375",
                "height": "7.777777777777778",
            },
        }
        if special_type == "link" and link_url:
            node["specialStageLinkURL"] = link_url
            node["specialStageLinkTarget"] = "_blank"
        return node

    elements = [
        stage_node(
            "1-1 Basic: Intro & HTML5 Game",
            14.5, 77.5, ["1"],
            build_course_presentation_shell(intro_slides, "1-1 Wordyssey Course Presentation"),
            is_start=True,
        ),
        stage_node(
            "1-3 Basic: Food & Fruits Quiz",
            25.5, 71.5, ["0", "2"],
            mc_apple,
        ),
        stage_node(
            "2-1 Daily Life: Drag the Words",
            28.5, 37.5, ["1", "3"],
            make_dragtext(
                "Drag the English vocabulary words into the matching Wordyssey sentences.",
                "Wordi loves eating a sweet red *apple* after exploring Basic Meadow, or sharing warm cheesy *pizza* in the village! "
                "You can read stories inside a *book*, drive a four-wheel *car* down the road, and climb a majestic stone *castle* in Adventure Peaks.",
                "Wordyssey Vocabulary Drag the Words",
            ),
        ),
        stage_node(
            "2-3 Sunset Valley: True or False",
            39.0, 35.5, ["2", "4"],
            make_truefalse(
                "True or False: Wordi the Inu is a friendly puppy wearing a blue paw bandana.",
                True, "clue-dog.png", "Wordi the friendly puppy", image_dims, "Wordi True/False Check",
            ),
        ),
        stage_node(
            "3-1 Adventure: Wordi & Modes",
            53.5, 36.5, ["3", "5"],
            build_course_presentation_shell(adventure_slides, "3-1 Wordi & Modes Course Presentation"),
        ),
        stage_node(
            "3-3 Citadel: Memory Game",
            67.0, 36.5, ["4", "6"],
            make_memorygame(["apple", "star", "dog", "book", "castle", "pizza"], image_dims, "Wordyssey Clue Memory Game"),
        ),
        stage_node(
            "4-1 Future: 12 Word Flashcards",
            78.0, 50.5, ["5", "7"],
            make_dialogcards(0, 0, 100, 100, image_dims)["action"],
        ),
        stage_node(
            "4-3 Quantum Spire: Speed Quiz",
            90.0, 51.5, ["6", "8", "9"],
            make_single_choice_set(0, 0, 100, 100, ["star", "pizza", "car", "tree", "sun", "wave"])["action"],
        ),
        special_node(
            "Play Live HTML5 Game",
            78.0, 81.0, ["7", "9"],
            "link",
            link_url=game_url,
        ),
        special_node(
            "Final Stage: Star Palace Finish",
            88.0, 81.0, ["7", "8"],
            "finish",
        ),
    ]

    return {
        "showTitleScreen": True,
        "titleScreen": {
            "titleScreenIntroduction": (
                '<p style="text-align:center;">Complete each floating island stage and click <strong>Play Live HTML5 Game</strong> or the Course Presentation buttons to launch Wordyssey!</p>'
            ),
            "titleScreenMedium": {
                "library": "H5P.Image 1.1",
                "params": {
                    "file": {"path": title_rel_path, "mime": "image/png", "copyright": {"license": "U"}, "width": tw, "height": th},
                    "decorative": False,
                    "alt": "Wordyssey 5-Island Adventure Banner with Wordi",
                    "title": "Wordyssey Banner",
                    "contentName": "Image",
                    "expandImage": "Expand Image",
                    "minimizeImage": "Minimize Image",
                },
                "subContentId": new_id(),
                "metadata": {"contentType": "Image", "license": "U", "title": "Wordyssey Banner"},
            },
        },
        "headline": "Wordyssey: 5-Island Adventure Map",
        "gamemapSteps": {
            "backgroundImageSettings": {
                "backgroundImage": {
                    "path": map_rel_path,
                    "mime": "image/png",
                    "copyright": {"license": "U"},
                    "width": mw,
                    "height": mh,
                }
            },
            "gamemap": {
                "elements": elements,
                "paths": [],
            },
        },
        "endScreen": {
            "noSuccess": {"endScreenTextNoSuccess": '<p style="text-align:center;">Great effort exploring Wordyssey! Retry any island stage to boost your English mastery.</p>'},
            "success": {"endScreenTextSuccess": '<p style="text-align:center;">Congratulations! You conquered all 5 Floating Islands and reached Star Palace!</p>'},
            "overallFeedback": [
                {"from": 0, "to": 59, "feedback": "Keep practicing with Wordi!"},
                {"from": 60, "to": 89, "feedback": "Well done, explorer!"},
                {"from": 90, "to": 100, "feedback": "Wordyssey Master!"},
            ],
        },
        "visual": {
            "stages": {
                "colorStage": "rgba(255, 122, 26, 0.96)",
                "colorStageLocked": "rgba(15, 23, 42, 0.88)",
                "colorStageCleared": "rgba(132, 204, 22, 0.96)",
                "showScoreStars": "always",
            },
            "paths": {
                "displayPaths": True,
                "style": {
                    "colorPath": "rgba(255, 255, 255, 0.92)",
                    "colorPathCleared": "rgba(198, 255, 61, 0.96)",
                    "pathWidth": "0.2",
                    "pathStyle": "dotted",
                },
            },
            "misc": {"useAnimation": True},
        },
        "audio": {
            "backgroundMusic": {"muteDuringExercise": True},
            "ambient": {},
        },
        "behaviour": {
            "enableRetry": True,
            "enableSolutionsButton": True,
            "map": {
                "showLabels": True,
                "roaming": "complete",
                "fog": "all",
            },
        },
        "l10n": {
            "start": "Start Adventure",
            "continue": "Continue",
            "restart": "Restart",
            "showSolutions": "Show solutions",
            "completedMap": "You have completed the Wordyssey Map!",
            "fullScoreButnoLivesLeft": "You achieved full score, but lost all your lives!",
            "fullScoreButTimeout": "You achieved full score, but ran out of time!",
            "confirmFinishHeader": "Finish map?",
            "confirmFinishDialog": "If you finish now, you will not be able to explore the map any longer.",
            "confirmFinishDialogSubmission": "Your score will be submitted.",
            "confirmFinishDialogQuestion": "Do you really want to finish the map?",
            "confirmAccessDeniedHeader": "Stage locked",
            "confirmAccessDeniedDialog": "Complete the previous connected island stage first to unlock this stage.",
            "yes": "Yes",
            "no": "No",
            "confirmGameOverHeader": "Game over!",
            "confirmGameOverDialog": "You have lost all your lives. Please try again!",
            "confirmTimeoutHeader": "Time out!",
            "confirmTimeoutDialog": "You ran out of time.",
            "confirmTimeoutDialogLostLife": "You ran out of time and lost a life.",
            "confirmScoreIncompleteHeader": "Not full score!",
            "confirmIncompleteScoreDialogLostLife": "You did not achieve full score and lost a life.",
            "confirmFullScoreHeader": "You achieved full score!",
            "confirmFullScoreDialog": "You have collected enough points to finish this map with a full score, and you can explore the rest if you wish.",
            "confirmFullScoreDialogLoseLivesAmendmend": "Beware: you may still lose lives!",
            "ok": "OK",
            "noStages": "No valid stages were set for the map.",
            "confirmGameOverDialogTimeout": "You have run out of time. Please try again!",
        },
        "a11y": {
            "buttonFinish": "Finish the map",
            "buttonAudioActive": "Mute audio. Currently unmuted.",
            "buttonAudioInactive": "Unmute audio. Currently muted.",
            "close": "Close",
            "yourResult": "You got @score out of @total points",
            "mapWasOpened": "The Wordyssey map was opened.",
            "mapSolutionsWasOpened": "The map was opened in solutions mode.",
            "startScreenWasOpened": "The title screen was opened.",
            "endScreenWasOpened": "The end screen was opened.",
            "exerciseLabel": ". Exercise for @stagelabel",
            "stageButtonLabel": "Stage: @stagelabel",
            "adjacentStageLabel": "Adjacent stage of @stagelabelOrigin: @stagelabelNeighbor",
            "locked": "Locked",
            "cleared": "Cleared",
            "applicationInstructions": "Use space or enter key to activate current stage. Use arrow keys to select adjacent stage.",
            "applicationDescription": "Wordyssey Game Map",
            "movedToStage": "Moved to @stagelabel",
            "stageUnlocked": "Stage @stagelabel was unlocked.",
            "toolbarFallbackLabel": "Wordyssey Map",
            "enterFullscreen": "Enter fullscreen mode",
            "exitFullscreen": "Exit fullscreen mode",
        },
    }


def build_course_presentation_content(game_url: str, image_dims: dict[str, tuple[int, int]]) -> dict:
    hw, hh = image_dims["wordi-hero.png"]
    mw, mh = image_dims["world-map.png"]
    ew, eh = image_dims["wordi-expressions.png"]

    def clue_img(x, y, w, word):
        cw, ch = image_dims[f"clue-{word}.png"]
        return make_image(x, y, w, round(w * 16 / 9, 2), f"images/clue-{word}.png", cw, ch, f"{word} clue illustration", word.capitalize())

    slide1 = {
        "keywords": [{"main": "1. Welcome & Play Wordyssey"}],
        "slideBackgroundSelector": {"fillSlideBackground": "#0f0e13"},
        "elements": [
            make_shape(3, 5, 94, 90, fill="#17161d", border="#f4efe6", bw="2", radius="4"),
            make_image(6, 13, 27, 48, "images/wordi-hero.png", hw, hh, "Wordi the Inu mascot", "Wordi the Inu"),
            make_text(
                36, 8, 58, 33,
                '<h3><span style="color:#c6ff3d;">WORDYSSEY: ENGLISH ODYSSEY</span></h3>'
                '<p><span style="color:#f4efe6;">An interactive English vocabulary adventure across <strong>5 floating islands</strong> and <strong>13 action stages</strong> starring Wordi the Inu.</span></p>'
                '<p><span style="color:#ffd43b;"><em>"One word at a time, you can go a long way!"</em></span></p>',
            ),
            make_shape(36, 43, 58, 22, fill="#211f29", border="#c6ff3d", bw="2", radius="4"),
            make_text(
                38, 44.5, 54, 7.5,
                '<p><span style="color:#c6ff3d;"><strong>LAUNCH HTML5 GAME (GITHUB PAGES)</strong></span></p>',
            ),
            make_shape(38, 53, 54, 9.5, fill="#fff9ee", border="#c6ff3d", bw="2", radius="4"),
            make_link(39.5, 54, 51, 7.5, "Open Playable Wordyssey HTML5 Game", game_url, display_as_button=False, opacity=0),
            # Slide quick-jump buttons
            make_shape(6, 70, 28, 18, fill="#211f29", border="#ff7a1a", bw="2", radius="3"),
            make_text(7.5, 72, 25, 14, '<p><span style="color:#ff7a1a;"><strong>5 Floating Worlds</strong></span><br><span style="color:#f4efe6;">Explore Map &amp; Stages</span></p>'),
            make_goto_hotspot(6, 70, 28, 18, 2, "Go to Slide 2: Overworld Map"),

            make_shape(36, 70, 28, 18, fill="#211f29", border="#5ce1e6", bw="2", radius="3"),
            make_text(37.5, 72, 25, 14, '<p><span style="color:#5ce1e6;"><strong>12 Vocabulary Cards</strong></span><br><span style="color:#f4efe6;">Study Word Flashcards</span></p>'),
            make_goto_hotspot(36, 70, 28, 18, 4, "Go to Slide 4: Flashcards"),

            make_shape(66, 70, 28, 18, fill="#211f29", border="#c6ff3d", bw="2", radius="3"),
            make_text(67.5, 72, 25, 14, '<p><span style="color:#c6ff3d;"><strong>Interactive Quiz</strong></span><br><span style="color:#f4efe6;">Test Your Mastery</span></p>'),
            make_goto_hotspot(66, 70, 28, 18, 5, "Go to Slide 5: Quiz"),
        ],
    }

    slide2 = {
        "keywords": [{"main": "2. Overworld Map & 5 Islands"}],
        "slideBackgroundSelector": {"fillSlideBackground": "#0f0e13"},
        "elements": [
            make_text(4, 3, 92, 10, '<h2><span style="color:#ffd43b;">5 FLOATING ISLANDS &amp; 13 STAGES</span></h2>'),
            make_image(4, 16, 54, 54, "images/world-map.png", mw, mh, "Wordyssey 5-island overworld map", "Overworld Map"),
            make_shape(60, 15, 36, 61, fill="#17161d", border="#f4efe6", bw="2", radius="3"),
            make_text(
                62, 16.5, 32, 58,
                '<p><span style="font-size:0.875em;color:#c6ff3d;"><strong>1. Basic (1-1–1-3):</strong></span> <span style="font-size:0.875em;color:#f4efe6;">Meadows, pads &amp; windmills.</span></p>'
                '<p><span style="font-size:0.875em;color:#ff7a1a;"><strong>2. Daily Life (2-1–2-3):</strong></span> <span style="font-size:0.875em;color:#f4efe6;">Carts &amp; river bridges.</span></p>'
                '<p><span style="font-size:0.875em;color:#5b7cff;"><strong>3. Adventure (3-1–3-3):</strong></span> <span style="font-size:0.875em;color:#f4efe6;">Ice, spikes &amp; castle lifts.</span></p>'
                '<p><span style="font-size:0.875em;color:#5ce1e6;"><strong>4. Future (4-1–4-3):</strong></span> <span style="font-size:0.875em;color:#f4efe6;">Monorails &amp; quantum blocks.</span></p>'
                '<p><span style="font-size:0.875em;color:#ffd43b;"><strong>5. Star Palace:</strong></span> <span style="font-size:0.875em;color:#f4efe6;">Word Titan Final Boss!</span></p>',
            ),
            make_shape(4, 79, 92, 15, fill="#211f29", border="#c6ff3d", bw="2", radius="4"),
            make_text(6, 82, 52, 9, '<p><span style="color:#f4efe6;"><strong>Modes:</strong> Casual (4 HP) · Normal (3 HP) · Hero (2 HP, 2x Score)</span></p>'),
            make_shape(59, 81.2, 35, 10.6, fill="#fff9ee", border="#c6ff3d", bw="2", radius="4"),
            make_link(60.5, 82.4, 32, 8.2, "Launch Wordyssey Game", game_url, display_as_button=False, opacity=0),
        ],
    }

    slide3 = {
        "keywords": [{"main": "3. Controls & Game Mechanics"}],
        "slideBackgroundSelector": {"fillSlideBackground": "#0f0e13"},
        "elements": [
            make_text(4, 4, 92, 11, '<h2><span style="color:#5ce1e6;">CONTROLS, COMBAT &amp; ISLAND MECHANICS</span></h2>'),
            make_shape(4, 17, 44, 76, fill="#17161d", border="#c6ff3d", bw="2", radius="3"),
            make_text(
                6, 18.5, 40, 73,
                '<h3><span style="color:#c6ff3d;">Wordi Controls</span></h3>'
                '<ul>'
                '<li><span style="font-size:0.875em;color:#f4efe6;"><strong>Move:</strong> <code>A / D</code> or <code>Left / Right</code></span></li>'
                '<li><span style="font-size:0.875em;color:#f4efe6;"><strong>Jump / Double Jump:</strong> <code>W</code> or <code>Space</code></span></li>'
                '<li><span style="font-size:0.875em;color:#f4efe6;"><strong>Bark Blast:</strong> <code>J</code> or <code>Left Click</code></span></li>'
                '<li><span style="font-size:0.875em;color:#f4efe6;"><strong>Dash (i-frames):</strong> <code>Shift</code> or <code>K</code></span></li>'
                '<li><span style="font-size:0.875em;color:#f4efe6;"><strong>Ground Pound:</strong> <code>S</code> in mid-air</span></li>'
                '<li><span style="font-size:0.875em;color:#f4efe6;"><strong>Stomp:</strong> Land on slimes &amp; bats</span></li>'
                '</ul>',
            ),
            make_shape(52, 17, 44, 76, fill="#17161d", border="#ff7a1a", bw="2", radius="3"),
            make_text(
                54, 18.5, 40, 73,
                '<h3><span style="color:#ff7a1a;">Stage Mechanics &amp; Chests</span></h3>'
                '<ul>'
                '<li><span style="font-size:0.875em;color:#f4efe6;"><strong>Mystery Word Chests:</strong> Solve clues for <strong>+500 pts</strong> &amp; Shield!</span></li>'
                '<li><span style="font-size:0.875em;color:#f4efe6;"><strong>Bounce Pads &amp; Elevators:</strong> Reach high star rings.</span></li>'
                '<li><span style="font-size:0.875em;color:#f4efe6;"><strong>Crumbling Planks:</strong> Shake and fall after 0.8s.</span></li>'
                '<li><span style="font-size:0.875em;color:#f4efe6;"><strong>Ice &amp; Quantum Blocks:</strong> Time jumps across phase ledges.</span></li>'
                '<li><span style="font-size:0.875em;color:#f4efe6;"><strong>Combos &amp; Speech:</strong> Web Audio + spoken pronunciation!</span></li>'
                '</ul>',
            ),
        ],
    }

    slide4 = {
        "keywords": [{"main": "4. Vocabulary Flashcards"}],
        "slideBackgroundSelector": {"fillSlideBackground": "#0f0e13"},
        "elements": [
            make_text(4, 3, 92, 10, '<h2><span style="color:#c6ff3d;">WORDYSSEY VOCABULARY BANK (12 WORDS)</span></h2>'),
            make_shape(4, 15, 58, 78, fill="#17161d", border="#f4efe6", bw="2", radius="3"),
            make_text(
                6, 17, 54, 74,
                '<p><span style="color:#ff7a1a;"><strong>Food &amp; Fruits</strong></span><br><span style="font-size:0.875em;color:#f4efe6;"><code>apple</code> · <code>pizza</code></span></p>'
                '<p><span style="color:#5ce1e6;"><strong>Animals</strong></span><br><span style="font-size:0.875em;color:#f4efe6;"><code>dog</code> (Wordi) · <code>cat</code></span></p>'
                '<p><span style="color:#c6ff3d;"><strong>Objects &amp; Nature</strong></span><br><span style="font-size:0.875em;color:#f4efe6;"><code>star</code> · <code>book</code> · <code>heart</code> · <code>tree</code> · <code>sun</code></span></p>'
                '<p><span style="color:#ffd43b;"><strong>Travel &amp; Places</strong></span><br><span style="font-size:0.875em;color:#f4efe6;"><code>castle</code> · <code>car</code> · <code>wave</code></span></p>',
            ),
            make_shape(65, 15, 31, 78, fill="#211f29", border="#5ce1e6", bw="2", radius="3"),
            make_image(70.5, 19, 20, 35.5, "images/wordi-hero.png", hw, hh, "Wordi flashcard guide", "Wordi Flashcards"),
            make_text(
                67, 56, 27, 16,
                '<p style="text-align:center;"><span style="font-size:0.875em;color:#f4efe6;"><strong>Open 12 Interactive Flashcards:</strong></span></p>',
            ),
            make_dialogcards(78, 72, 10, 14, image_dims),
        ],
    }

    def quiz_slide(num, heading, wid):
        _w, topic, prompt, answer, choices, desc = next(it for it in VOCAB_ITEMS if it[0] == wid)
        return {
            "keywords": [{"main": f"{num}. Quiz: {topic} ({answer.capitalize()})"}],
            "slideBackgroundSelector": {"fillSlideBackground": "#f4efe6"},
            "elements": [
                make_text(4, 3, 92, 10, f'<h2><span style="color:#0b0a0e;">{heading}</span></h2>'),
                clue_img(5, 20, 28, wid),
                make_text(5, 73, 28, 12, f'<p style="text-align:center;"><span style="color:#0b0a0e;"><strong>Topic: {topic}</strong></span></p>'),
                make_multichoice(36, 16, 59, 78, prompt, answer, choices, desc),
            ],
        }

    slide5 = quiz_slide(5, "QUIZ 1: FOOD & FRUITS", "apple")
    slide6 = quiz_slide(6, "QUIZ 2: ANIMALS & COMPANIONS", "dog")
    slide7 = quiz_slide(7, "QUIZ 3: OBJECTS & LEARNING", "book")
    slide8 = quiz_slide(8, "QUIZ 4: PLACES & LANDMARKS", "castle")

    slide9 = {
        "keywords": [{"main": "9. Speed Vocabulary Challenge"}],
        "slideBackgroundSelector": {"fillSlideBackground": "#f4efe6"},
        "elements": [
            make_text(4, 3, 92, 10, '<h2><span style="color:#0b0a0e;">SPEED VOCABULARY CHALLENGE (6 QUESTIONS)</span></h2>'),
            make_single_choice_set(5, 15, 90, 79, ["star", "pizza", "car", "tree", "sun", "wave"]),
        ],
    }

    slide10 = {
        "keywords": [{"main": "10. Wordi Character & Play Live"}],
        "slideBackgroundSelector": {"fillSlideBackground": "#0f0e13"},
        "elements": [
            make_text(4, 4, 92, 10, '<h2><span style="color:#ff7a1a;">MEET WORDI &amp; LAUNCH THE FULL ADVENTURE</span></h2>'),
            make_image(4, 16, 92, 47, "images/wordi-expressions.png", ew, eh, "Wordi four expressions: Happy, Surprised, Sad, Excited", "Wordi Expressions"),
            make_shape(4, 66, 53, 26, fill="#17161d", border="#f4efe6", bw="2", radius="3"),
            make_text(
                6, 68, 49, 22,
                '<p><span style="color:#f4efe6;"><strong>Palette:</strong> Orange <code>#ff9533</code> · Cream <code>#fff4e0</code> · Blue <code>#0a84ff</code> · Pink <code>#ff9eaa</code></span></p>'
                '<p><span style="color:#ffd43b;">Next slide shows your H5P Quiz Summary score — or jump straight into the 13-stage HTML5 game!</span></p>',
            ),
            make_shape(60, 66, 36, 26, fill="#211f29", border="#c6ff3d", bw="2", radius="4"),
            make_shape(61.5, 72.5, 33, 13, fill="#fff9ee", border="#c6ff3d", bw="2", radius="4"),
            make_link(63, 74.5, 30, 9, "Play Wordyssey HTML5 Game", game_url, display_as_button=False, opacity=0),
        ],
    }

    return {
        "presentation": {
            "slides": [slide1, slide2, slide3, slide4, slide5, slide6, slide7, slide8, slide9, slide10],
            "keywordListEnabled": True,
            "keywordListAlwaysShow": False,
            "keywordListAutoHide": True,
            "keywordListOpacity": 90,
            "globalBackgroundSelector": {},
        },
        "override": {
            "activeSurface": False,
            "hideSummarySlide": False,
            "enablePrintButton": False,
            "social": {
                "showFacebookShare": False,
                "facebookShare": {
                    "url": "@currentpageurl",
                    "quote": "I scored @score out of @maxScore on Wordyssey!",
                },
                "showTwitterShare": False,
                "twitterShare": {
                    "statement": "I scored @score out of @maxScore on Wordyssey!",
                    "url": "@currentpageurl",
                    "hashtags": "wordyssey,h5p,english",
                },
                "showGoogleShare": False,
                "googleShareUrl": "@currentpageurl",
            },
            "summarySlideSolutionButton": True,
            "summarySlideRetryButton": True,
        },
        "l10n": {
            "slide": "Slide",
            "score": "Score",
            "yourScore": "Your Score",
            "maxScore": "Max Score",
            "total": "Total",
            "totalScore": "Total Score",
            "showSolutions": "Show solutions",
            "retry": "Retry",
            "exportAnswers": "Export text",
            "hideKeywords": "Hide sidebar navigation menu",
            "showKeywords": "Show sidebar navigation menu",
            "fullscreen": "Fullscreen",
            "exitFullscreen": "Exit fullscreen",
            "prevSlide": "Previous slide",
            "nextSlide": "Next slide",
            "currentSlide": "Current slide",
            "lastSlide": "Last slide",
            "solutionModeTitle": "Exit solution mode",
            "solutionModeText": "Solution Mode",
            "summaryMultipleTaskText": "Multiple tasks",
            "scoreMessage": "You achieved:",
            "shareFacebook": "Share on Facebook",
            "shareTwitter": "Share on Twitter",
            "shareGoogle": "Share on Google+",
            "summary": "Summary",
            "solutionsButtonTitle": "Show comments",
            "printTitle": "Print",
            "printIngress": "How would you like to print this presentation?",
            "printAllSlides": "Print all slides",
            "printCurrentSlide": "Print current slide",
            "noTitle": "No title",
            "accessibilitySlideNavigationExplanation": "Use left and right arrow to change slide in that direction whenever canvas is selected.",
            "accessibilityCanvasLabel": "Presentation canvas. Use left and right arrow to move between slides.",
            "accessibilityProgressBarLabel": "Choose slide to display",
            "containsNotCompleted": "@slideName contains not completed interaction",
            "containsCompleted": "@slideName contains completed interaction",
            "slideCount": "Slide @index of @total",
            "containsOnlyCorrect": "@slideName only has correct answers",
            "containsIncorrectAnswers": "@slideName has incorrect answers",
            "shareResult": "Share Result",
            "accessibilityTotalScore": "You got @score of @maxScore points in total",
            "accessibilityEnteredFullscreen": "Entered fullscreen",
            "accessibilityExitedFullscreen": "Exited fullscreen",
            "confirmDialogHeader": "Submit your answers",
            "confirmDialogText": "This will submit your results, do you want to continue?",
            "confirmDialogConfirmText": "Submit and see results",
            "slideshowNavigationLabel": "Slideshow navigation",
            "confirmDialogConfirmLabel": "Confirm",
            "confirmDialogCancelLabel": "Cancel",
        },
    }


def fetch_or_load_base(existing_path: Path, hub_url: str, scratch_cache: Path | None) -> bytes:
    if existing_path.exists():
        return existing_path.read_bytes()
    if scratch_cache and scratch_cache.exists():
        return scratch_cache.read_bytes()
    print(f"Downloading official H5P libraries from {hub_url} ...")
    return urllib.request.urlopen(hub_url, timeout=30).read()


def bundle_standalone_html() -> str:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    style_css = (ROOT / "style.css").read_text(encoding="utf-8")
    theme_css = (ROOT / "theme.css").read_text(encoding="utf-8")
    sound_js = (ROOT / "sound.js").read_text(encoding="utf-8")
    game_js = (ROOT / "game.js").read_text(encoding="utf-8")
    enhance_js = (ROOT / "enhance.js").read_text(encoding="utf-8")

    html = html.replace('          <a id="btnH5PConnect" href="h5p-connect.html" class="chip" style="color:var(--lime);text-decoration:none;">H5P / Lumi</a>\n', "")
    html = html.replace('<link rel="stylesheet" href="style.css">', f"<style>\n{style_css}\n</style>")
    html = html.replace('<link rel="stylesheet" href="theme.css">', f"<style>\n{theme_css}\n</style>")
    html = html.replace('<script src="sound.js"></script>', f"<script>\n{sound_js}\n</script>")
    html = html.replace('<script src="game.js"></script>', f"<script>\n{game_js}\n</script>")
    html = html.replace('<script src="enhance.js"></script>', f"<script>\n{enhance_js}\n</script>")
    return html


def build_course_presentation(game_url: str, title: str, scratch_dir: Path | None = None):
    out_path = H5P_DIR / "wordyssey-course-presentation.h5p"
    base_bytes = fetch_or_load_base(
        out_path,
        HUB_CP_URL,
        scratch_dir / "H5P.CoursePresentation.h5p" if scratch_dir else None,
    )

    import io
    with zipfile.ZipFile(io.BytesIO(base_bytes), "r") as zin:
        base_h5p = json.loads(zin.read("h5p.json").decode("utf-8"))
        lib_entries = [
            (info, zin.read(info.filename))
            for info in zin.infolist()
            if not info.filename.startswith("content/") and info.filename != "h5p.json"
        ]

    base_h5p["title"] = title
    base_h5p["language"] = "en"
    base_h5p["defaultLanguage"] = "en"

    image_files = {}
    image_dims = {}
    for p in sorted(ASSETS_DIR.glob("*.png")):
        raw = p.read_bytes()
        image_files[p.name] = raw
        image_dims[p.name] = png_size(raw)

    content_obj = build_course_presentation_content(game_url, image_dims)

    tmp_path = out_path.with_suffix(".h5p.tmp")
    with zipfile.ZipFile(tmp_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zout:
        zout.writestr("h5p.json", json.dumps(base_h5p, ensure_ascii=False, separators=(",", ":")))
        zout.writestr("content/content.json", json.dumps(content_obj, ensure_ascii=False, separators=(",", ":")))
        for fname, raw in image_files.items():
            zout.writestr(f"content/images/{fname}", raw)
        for info, raw in lib_entries:
            zout.writestr(info.filename, raw)

    os.replace(tmp_path, out_path)
    print(f"Built {out_path} ({out_path.stat().st_size:,} bytes) -> game URL: {game_url}")


def build_iframe_embed(iframe_url: str, title: str, offline_html: bool = False, scratch_dir: Path | None = None):
    out_path = H5P_DIR / "wordyssey-iframe-embed.h5p"
    base_bytes = fetch_or_load_base(
        out_path,
        HUB_IF_URL,
        scratch_dir / "H5P.IFrameEmbed.h5p" if scratch_dir else None,
    )

    import io
    with zipfile.ZipFile(io.BytesIO(base_bytes), "r") as zin:
        base_h5p = json.loads(zin.read("h5p.json").decode("utf-8"))
        lib_entries = [
            (info, zin.read(info.filename))
            for info in zin.infolist()
            if not info.filename.startswith("content/") and info.filename != "h5p.json"
        ]

    base_h5p["title"] = f"{title} (Playable IFrame)"
    base_h5p["language"] = "en"
    base_h5p["defaultLanguage"] = "en"

    source_val = "wordyssey.html" if offline_html else iframe_url.strip()
    content_obj = {
        "width": "1040px",
        "height": "680px",
        "minWidth": "360px",
        "source": source_val,
        "resizeSupported": True,
    }

    tmp_path = out_path.with_suffix(".h5p.tmp")
    with zipfile.ZipFile(tmp_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zout:
        zout.writestr("h5p.json", json.dumps(base_h5p, ensure_ascii=False, separators=(",", ":")))
        zout.writestr("content/content.json", json.dumps(content_obj, ensure_ascii=False, separators=(",", ":")))
        if offline_html:
            zout.writestr("content/wordyssey.html", bundle_standalone_html().encode("utf-8"))
        for info, raw in lib_entries:
            zout.writestr(info.filename, raw)

    os.replace(tmp_path, out_path)
    print(f"Built {out_path} ({out_path.stat().st_size:,} bytes) -> source: {source_val}")


def build_game_map(game_url: str, title: str, scratch_dir: Path | None = None):
    out_path = H5P_DIR / "wordyssey-game-map.h5p"
    cp_path = H5P_DIR / "wordyssey-course-presentation.h5p"

    gm_bytes = fetch_or_load_base(
        out_path,
        HUB_GM_URL,
        scratch_dir / "H5P.GameMap.h5p" if scratch_dir else None,
    )
    cp_bytes = fetch_or_load_base(
        cp_path,
        HUB_CP_URL,
        scratch_dir / "H5P.CoursePresentation.h5p" if scratch_dir else None,
    )

    import io
    lib_files: dict[str, bytes] = {}
    deps_map: dict[str, dict] = {}

    for raw_pkg in (cp_bytes, gm_bytes):
        with zipfile.ZipFile(io.BytesIO(raw_pkg), "r") as zin:
            pkg_h5p = json.loads(zin.read("h5p.json").decode("utf-8"))
            for d in pkg_h5p.get("preloadedDependencies", []):
                deps_map[d["machineName"]] = d
            for info in zin.infolist():
                if info.filename.startswith("content/") or info.filename == "h5p.json":
                    continue
                lib_files[info.filename] = zin.read(info.filename)

    used_machines = [
        "H5P.GameMap",
        "H5P.CoursePresentation",
        "H5P.AdvancedText",
        "H5P.Link",
        "H5P.Image",
        "H5P.Shape",
        "H5P.MultiChoice",
        "H5P.DragText",
        "H5P.TrueFalse",
        "H5P.MemoryGame",
        "H5P.Dialogcards",
        "H5P.SingleChoiceSet",
        "H5P.Question",
        "H5P.JoubelUI",
        "H5P.FontIcons",
        "H5P.Transition",
        "H5P.TextUtilities",
        "H5P.Timer",
        "H5P.SoundJS",
        "FontAwesome",
        "jQuery.ui",
    ]
    preloaded = [deps_map[m] for m in used_machines if m in deps_map]

    gm_h5p = {
        "title": title,
        "language": "en",
        "defaultLanguage": "en",
        "mainLibrary": "H5P.GameMap",
        "embedTypes": ["iframe"],
        "license": "U",
        "preloadedDependencies": preloaded,
    }

    image_files = {}
    image_dims = {}
    for p in sorted(ASSETS_DIR.glob("*.png")):
        raw = p.read_bytes()
        image_files[p.name] = raw
        image_dims[p.name] = png_size(raw)

    content_obj = build_gamemap_content(game_url, image_dims)

    tmp_path = out_path.with_suffix(".h5p.tmp")
    with zipfile.ZipFile(tmp_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zout:
        zout.writestr("h5p.json", json.dumps(gm_h5p, ensure_ascii=False, separators=(",", ":")))
        zout.writestr("content/content.json", json.dumps(content_obj, ensure_ascii=False, separators=(",", ":")))
        for fname, raw in image_files.items():
            zout.writestr(f"content/images/{fname}", raw)
        for fname, raw in lib_files.items():
            zout.writestr(fname, raw)

    os.replace(tmp_path, out_path)
    print(f"Built {out_path} ({out_path.stat().st_size:,} bytes) -> game URL: {game_url}")


def main():
    parser = argparse.ArgumentParser(description="Build Wordyssey .h5p packages for Lumi Cloud and Lumi Desktop.")
    parser.add_argument("--url", default=DEFAULT_GAME_URL, help="Live GitHub Pages URL for Wordyssey (e.g. https://user.github.io/wordyssey/)")
    parser.add_argument("--title", default="Wordyssey: Wordi's English Odyssey", help="H5P package title")
    parser.add_argument("--iframe-url", default=None, help="Optional override URL for wordyssey-iframe-embed.h5p (defaults to --url)")
    parser.add_argument("--offline-html", action="store_true", help="Bundle standalone wordyssey.html inside wordyssey-iframe-embed.h5p (for LMSs permitting html in content/)")
    parser.add_argument("--scratch", default=None, help="Optional directory containing cached Hub .h5p templates")
    args = parser.parse_args()

    H5P_DIR.mkdir(parents=True, exist_ok=True)
    scratch_dir = Path(args.scratch) if args.scratch else None
    build_course_presentation(args.url, args.title, scratch_dir)
    build_game_map(args.url, args.title, scratch_dir)
    build_iframe_embed(args.iframe_url or args.url, args.title, args.offline_html, scratch_dir)


if __name__ == "__main__":
    main()
