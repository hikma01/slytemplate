"""SPIKE_ONLY / NON_PRODUCTION — shared fixture HTML for WeasyPrint."""
import html

def fixture_html(fixture):
    def text(index):
        suffix = " — Élève, façade, naïf, Straße, 東京, Montréal, Łódź, résumé." if fixture.get("specialCharacters") else ""
        return f"Mission {index + 1}: led measurable delivery, improved quality, and documented decisions for stakeholders.{suffix}"
    experiences = ""
    for index in range(fixture["experienceCount"]):
        page_break = '<div class="page-break"></div>' if fixture.get("pageBreakAfterExperience") == index + 1 else ""
        experiences += (
            f'<section class="slot experience-slot" data-slot-id="experience_{index + 1}"><h2>Experience {index + 1}</h2>'
            + "".join(f"<p>{html.escape(text(index + paragraph))}</p>" for paragraph in range(fixture["paragraphsPerExperience"]))
            + f"</section>{page_break}"
        )
    skills = "".join(f"<li>Skill {index + 1}</li>" for index in range(fixture["skillCount"]))
    education = "".join(f"<li>Education {index + 1} — certification and continuing learning</li>" for index in range(fixture["educationCount"]))
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>
@page {{ size: A4; margin: 14mm; }} * {{ box-sizing: border-box; }} body {{ font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.32; }}
#document {{ width: 182mm; margin: 0 auto; }} #content {{ min-height: 269mm; }} header {{ border-bottom: 2px solid #17202a; padding-bottom: 5mm; margin-bottom: 5mm; }}
h1 {{ font-size: 22pt; margin: 0 0 2mm; }} h2 {{ font-size: 12pt; margin: 4mm 0 1.5mm; color: #254b70; }} p {{ margin: 0 0 2mm; }}
.columns {{ display: grid; grid-template-columns: 2fr 1fr; gap: 7mm; }} .slot {{ break-inside: avoid; }} .page-break {{ break-before: page; page-break-before: always; }}
</style></head><body><main id="document"><div id="content"><header class="slot" data-slot-id="identity"><h1>{html.escape(fixture['name'])}</h1><div>{html.escape(fixture['title'])}</div><p>{html.escape(fixture['summary'])}</p></header><div class="columns"><div><section class="slot" data-slot-id="experience"><h2>Experience</h2>{experiences}</section></div><aside><section class="slot" data-slot-id="skills"><h2>Skills</h2><ul>{skills}</ul></section><section class="slot" data-slot-id="education"><h2>Education</h2><ul>{education}</ul></section></aside></div></div></main></body></html>'''
