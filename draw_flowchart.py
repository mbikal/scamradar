import os
import matplotlib.pyplot as plt

def main():
    desktop_dir = os.path.join(os.path.expanduser("~"), "Desktop")
    artifact_dir = "/Users/bikalsmacbook/.gemini/antigravity/brain/f6fd07a7-2438-4d7b-bfc6-1cf7af059227"
    
    if not os.path.exists(artifact_dir):
        os.makedirs(artifact_dir)

    # Create figure: 8 inches wide, 20 inches tall for a spacious vertical layout
    fig, ax = plt.subplots(figsize=(8.0, 20.0))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Color Palette: blue-only academic style
    color_dark_blue = '#1e3a8a'
    color_medium_blue = '#2563eb'
    color_light_blue = '#bfdbfe'
    color_border_blue = '#1e40af'
    
    # Styles
    font_style = {'fontsize': 9.5, 'color': color_dark_blue, 'ha': 'center', 'va': 'center'}
    bbox_style = dict(boxstyle="round,pad=0.6", fc="white", ec=color_border_blue, lw=1.2)
    final_bbox_style = dict(boxstyle="round,pad=0.8", fc="white", ec=color_medium_blue, lw=2.5)

    # Helper function to draw box
    def draw_box(x, y, text, is_final=False):
        style = final_bbox_style if is_final else bbox_style
        return ax.text(x, y, text, bbox=style, **font_style)

    # Helper function to draw vertical arrow from y1 down to y2
    def draw_arrow(x, y1, y2):
        ax.annotate('', xy=(x, y2), xytext=(x, y1),
                    arrowprops=dict(arrowstyle="->", color=color_medium_blue, lw=1.5, shrinkA=15, shrinkB=15))

    # Helper function to draw divider line
    def draw_divider(y, label):
        ax.axhline(y, color=color_light_blue, linestyle='--', linewidth=1.2)
        ax.text(0.5, y + 1.2, label, fontsize=11, color=color_medium_blue, fontweight='bold', ha='left')

    # Section 1: Browser Extension
    ax.text(0.5, 98.2, "Browser Extension", fontsize=11.5, color=color_medium_blue, fontweight='bold', ha='left')
    
    draw_box(5, 95, "User opens popup on\nFacebook Marketplace profile")
    draw_arrow(5, 95, 90)

    draw_box(5, 90, "ResultView.tsx mounts\nand calls runAnalysis")
    draw_arrow(5, 90, 85)

    draw_box(5, 85, "Message sent to content.ts\nrequesting seller data")
    draw_arrow(5, 85, 80)

    draw_box(5, 80, "content.ts calls scrapeSellerProfile\nusing scraper.ts")
    draw_arrow(5, 80, 75)

    draw_box(5, 75, "Scraped seller data\nreturned to ResultView.tsx")
    draw_arrow(5, 75, 70)

    draw_box(5, 70, "Message with scraped data\nsent to background.ts")
    draw_arrow(5, 70, 61.5)

    # Divider 1: Backend Service
    draw_divider(65, "Backend Service")

    draw_box(5, 58, "background.ts sends HTTP POST\nrequest to /api/analyze")
    draw_arrow(5, 58, 53)

    draw_box(5, 53, "FastAPI app.py receives request")
    draw_arrow(5, 53, 48)

    draw_box(5, 48, "Request validated against\nSellerData Pydantic model")
    draw_arrow(5, 48, 43)

    draw_box(5, 43, "Validated data converted to\ndictionary and passed to predict.py")
    draw_arrow(5, 43, 35)

    # Divider 2: Machine Learning Layer
    draw_divider(38, "Machine Learning Layer")

    draw_box(5, 31, "preprocess_input aligns data against MODEL_COLUMNS\nfilling missing fields with DEFAULT_FEATURE_VALUES")
    draw_arrow(5, 31, 26)

    draw_box(5, 26, "Feature vector passed to Random Forest\nclassifier loaded from fraud_model.pkl")
    draw_arrow(5, 26, 21)

    draw_box(5, 21, "Probability converted to risk tier\nusing fixed thresholds")
    draw_arrow(5, 21, 16)

    draw_box(5, 16, "Same feature vector passed to SHAP TreeExplainer\nloaded from shap_explainer.pkl via get_risk_factors")
    draw_arrow(5, 16, 11)

    draw_box(5, 11, "Risk score, risk level, and explanation\nfactors combined into JSON response")
    draw_arrow(5, 11, 4.5)

    # Final box below all three sections
    draw_box(5, 3.5, "Response returned through background.ts to ResultView.tsx\nand rendered as risk dial and explanation in popup", is_final=True)

    plt.tight_layout()
    
    plt.savefig(os.path.join(desktop_dir, 'figure6_1_flowchart.png'), dpi=300, bbox_inches='tight')
    plt.savefig(os.path.join(artifact_dir, 'figure6_1_flowchart.png'), dpi=300, bbox_inches='tight')
    plt.close()
    print("Flowchart generated successfully.")

if __name__ == "__main__":
    main()
