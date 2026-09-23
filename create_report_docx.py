import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def create_element(name):
    return OxmlElement(name)

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_heading_styled(doc, text, level):
    h = doc.add_heading(text, level=level)
    h.paragraph_format.space_before = Pt(12)
    h.paragraph_format.space_after = Pt(6)
    h.paragraph_format.keep_with_next = True
    run = h.runs[0]
    if level == 1:
        run.font.size = Pt(16)
        run.font.color.rgb = RGBColor(0, 51, 102) # Deep Navy
        run.font.bold = True
    elif level == 2:
        run.font.size = Pt(13)
        run.font.color.rgb = RGBColor(0, 102, 153) # Teal Blue
        run.font.bold = True
    elif level == 3:
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(51, 51, 51)
        run.font.bold = True
    return h

def generate_docx():
    doc = Document()

    # Page Setup - 1 inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Set base Normal Style font
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Calibri'
    font.size = Pt(11)
    font.color.rgb = RGBColor(34, 34, 34)

    # ---------------------------------------------------------
    # COVER / HEADER TITLE
    # ---------------------------------------------------------
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_title = title_p.add_run("COMPREHENSIVE PROJECT REPORT")
    run_title.font.size = Pt(22)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(0, 51, 102)

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_after = Pt(18)
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_sub = sub_p.add_run("Real-Time 3D Racing Simulator Web Application using Three.js & WebGL\nCourse: Computer Graphics (CS 401)")
    run_sub.font.size = Pt(13)
    run_sub.font.italic = True
    run_sub.font.color.rgb = RGBColor(102, 102, 102)

    # Metadata Table
    meta_table = doc.add_table(rows=2, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for row in meta_table.rows:
        for cell in row.cells:
            cell.width = Inches(3.2)
            set_cell_background(cell, "F4F6F9")
            set_cell_margins(cell, top=120, bottom=120, left=150, right=150)
    
    meta_table.cell(0, 0).paragraphs[0].add_run("Project Name: 3D Racing Dodge").bold = True
    meta_table.cell(0, 1).paragraphs[0].add_run("Technology Stack: Three.js (r170), JS ES6, WebGL, Vite").bold = True
    meta_table.cell(1, 0).paragraphs[0].add_run("Focus Area: 3D Transformations, Lighting & Shading").bold = True
    meta_table.cell(1, 1).paragraphs[0].add_run("Architecture: Hierarchical Primitive Modeling & Shaders").bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # ---------------------------------------------------------
    # ABSTRACT & INTRODUCTION
    # ---------------------------------------------------------
    add_heading_styled(doc, "Executive Summary & Project Overview", level=1)
    
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(8)
    p.add_run("This report presents the architectural, mathematical, and practical engineering implementation of a high-performance, interactive 3D Racing Simulator web application constructed for the Computer Graphics laboratory curriculum. Developed using WebGL and the Three.js 3D library in vanilla JavaScript ES Modules, the project demonstrates real-time rendering, 3D affine transformations, perspective projections, illumination models, dynamic particle systems, and axis-aligned collision detection without relying on pre-rendered external 3D assets.")

    p2 = doc.add_paragraph()
    p2.paragraph_format.line_spacing = 1.15
    p2.paragraph_format.space_after = Pt(12)
    p2.add_run("The primary objective is to translate theoretical Computer Graphics algorithms—such as Matrix Multiplications, Euler Angle Rotations, Perspective Frustum Projection, Phong Illumination, Z-Buffer Depth Testing, and Axis-Aligned Bounding Box (AABB) Intersection Testing—into a fluid 60 FPS interactive browser experience.")

    # ---------------------------------------------------------
    # SECTION 1: GRAPHICS HARDWARE & PIPELINE (MODULE 1)
    # ---------------------------------------------------------
    add_heading_styled(doc, "1. Graphics Hardware & WebGL Execution Pipeline", level=1)

    add_heading_styled(doc, "1.1 Generic Architecture of Raster vs. WebGL Systems", level=2)
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(8)
    p.add_run("Modern real-time computer graphics relies on raster graphics architecture, where vector primitives (points, lines, polygons) are converted into discrete pixel grids (rasterized) on a display buffer. Unlike early random scan (vector) displays that drew continuous lines directly via electron beam deflection, WebGL utilizes GPU-accelerated rasterization pipelines:")

    # Bullet points for pipeline
    bp1 = doc.add_paragraph(style='List Bullet')
    bp1.add_run("Application & Scene Graph Stage (CPU/JavaScript): ").bold = True
    bp1.add_run("Manages hierarchical transformations, delta time update loops via requestAnimationFrame(), user inputs, physics, and draw calls.")

    bp2 = doc.add_paragraph(style='List Bullet')
    bp2.add_run("Geometry & Vertex Processing (GPU): ").bold = True
    bp2.add_run("Transforms local vertex coordinates into World Space, View Space, and Clip Space using 4x4 matrix multiplications ($M_{MVP} = M_{proj} \\cdot M_{view} \\cdot M_{world}$).")

    bp3 = doc.add_paragraph(style='List Bullet')
    bp3.add_run("Rasterization & Fragment Shading (GPU): ").bold = True
    bp3.add_run("Interpolates vertex parameters across triangles and evaluates pixel colors based on material maps, directional sunlight, and ambient lighting.")

    bp4 = doc.add_paragraph(style='List Bullet')
    bp4.add_run("Output Merging & Framebuffer: ").bold = True
    bp4.add_run("Performs Z-buffer depth testing and alpha blending before outputting the finalized color buffer to the HTML5 canvas element.")

    # ---------------------------------------------------------
    # SECTION 2: 2D & 3D GEOMETRIC TRANSFORMATIONS (MODULES 3 & 5)
    # ---------------------------------------------------------
    add_heading_styled(doc, "2. Geometric Transformations & Matrix Mathematics", level=1)

    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(8)
    p.add_run("All movement, vehicle body roll tilting, wheel rotation, obstacle scrolling, and spatial positioning in the application rely on 3D homogeneous coordinate transformation matrices ($4 \\times 4$). A 3D point $P(x, y, z)$ is represented in homogeneous coordinates as $P = [x, y, z, 1]^T$.")

    add_heading_styled(doc, "2.1 Translation, Scaling, and Rotation Matrices", level=2)

    # Formula Callout Box 1
    table_m = doc.add_table(rows=1, cols=1)
    table_m.alignment = WD_TABLE_ALIGNMENT.CENTER
    c = table_m.cell(0, 0)
    c.width = Inches(6.5)
    set_cell_background(c, "F8F9FA")
    set_cell_margins(c, top=140, bottom=140, left=180, right=180)
    
    cp = c.paragraphs[0]
    cp.paragraph_format.line_spacing = 1.2
    cp.add_run("Standard 4x4 Transformation Matrices:\n\n").bold = True
    cp.add_run("Translation Matrix T(tx, ty, tz):\n").bold = True
    cp.add_run("  [ 1  0  0  tx ]\n  [ 0  1  0  ty ]\n  [ 0  0  1  tz ]\n  [ 0  0  0   1 ]\n\n")
    cp.add_run("Rotation Matrix around Y-Axis (Yaw angle θ):\n").bold = True
    cp.add_run("  [  cos(θ)   0   sin(θ)   0 ]\n  [    0      1     0      0 ]\n  [ -sin(θ)   0   cos(θ)   0 ]\n  [    0      0     0      1 ]\n\n")
    cp.add_run("Rotation Matrix around Z-Axis (Roll / Tilt angle φ):\n").bold = True
    cp.add_run("  [  cos(φ)  -sin(φ)   0   0 ]\n  [  sin(φ)   cos(φ)   0   0 ]\n  [    0        0      1   0 ]\n  [    0        0      0   1 ]")

    add_heading_styled(doc, "2.2 Composite Transformation & Vehicle Steering Kinematics", level=2)
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(8)
    p.add_run("To compute the final world transformation matrix $M_{world}$ for the player car, transformations are combined via matrix multiplication (non-commutative property):")

    p_eq = doc.add_paragraph()
    p_eq.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_eq = p_eq.add_run("M_world = T(position.x, position.y, position.z) · R_z(steeringTilt) · R_y(yaw) · S(scale.x, scale.y, scale.z)")
    run_eq.bold = True
    run_eq.font.color.rgb = RGBColor(0, 51, 102)

    p_lerp = doc.add_paragraph()
    p_lerp.paragraph_format.line_spacing = 1.15
    p_lerp.paragraph_format.space_after = Pt(8)
    p_lerp.add_run("Smooth lateral movement across the 3 lanes is calculated using Linear Interpolation (Lerp) over frame delta time ($\\Delta t$):\n")
    p_lerp.add_run("  x_current = Lerp(x_current, x_target, α) = (1 - α) · x_current + α · x_target\n").bold = True
    p_lerp.add_run("where $\\alpha = 0.22$ determines the steering responsiveness factor, preventing abrupt positional snapping.")

    # ---------------------------------------------------------
    # SECTION 3: VIEWING, CLIPPING & PROJECTIONS (MODULES 4 & 5)
    # ---------------------------------------------------------
    add_heading_styled(doc, "3. Camera Systems & Perspective Projection", level=1)

    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(8)
    p.add_run("The simulator utilizes a third-person PerspectiveCamera positioned behind and above the car. Perspective projection models human visual perception where distant objects appear smaller according to distance $Z$.")

    add_heading_styled(doc, "3.1 Perspective Projection Matrix Formulation", level=2)
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(8)
    p.add_run("Given a vertical Field of View (FOV) $\\theta$, Aspect Ratio $a = \\frac{width}{height}$, Near plane $n$, and Far plane $f$, the perspective transformation matrix $M_{proj}$ maps the viewing frustum to Normalized Device Coordinates (NDC) $[-1, 1]^3$:")

    # Projection Box
    table_p = doc.add_table(rows=1, cols=1)
    table_p.alignment = WD_TABLE_ALIGNMENT.CENTER
    cp2 = table_p.cell(0, 0)
    cp2.width = Inches(6.5)
    set_cell_background(cp2, "F8F9FA")
    set_cell_margins(cp2, top=140, bottom=140, left=180, right=180)
    
    cpp = cp2.paragraphs[0]
    cpp.paragraph_format.line_spacing = 1.2
    cpp.add_run("Perspective Projection Matrix M_proj:\n\n").bold = True
    cpp.add_run("  [  1 / (a · tan(θ/2))        0                   0                     0      ]\n")
    cpp.add_run("  [         0           1 / tan(θ/2)               0                     0      ]\n")
    cpp.add_run("  [         0                  0          -(f + n) / (f - n)   -(2 · f · n) / (f - n) ]\n")
    cpp.add_run("  [         0                  0                  -1                     0      ]")

    add_heading_styled(doc, "3.2 Dynamic FOV Expansion during Nitro Boost", level=2)
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(8)
    p.add_run("To visually convey intense acceleration during Nitro Boost (activated via SPACE key), the vertical FOV $\\theta$ dynamically interpolates from $\\theta_{normal} = 60^\\circ$ to $\\theta_{nitro} = 78^\\circ$:\n")
    p.add_run("  θ_camera = Lerp(θ_camera, θ_target, 0.1)\n").bold = True
    p.add_run("This alters the perspective projection matrix in real-time, accentuating peripheral motion blur and depth perception.")

    # ---------------------------------------------------------
    # SECTION 4: LIGHTING, SHADING & MATERIALS (MODULE 6)
    # ---------------------------------------------------------
    add_heading_styled(doc, "4. Illumination Models, Shading, & Materials", level=1)

    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(8)
    p.add_run("Real-time rendering in the application employs Physically Based Rendering (PBR) via THREE.MeshStandardMaterial derived from the classic Phong Illumination Model.")

    add_heading_styled(doc, "4.1 Phong Illumination Reflection Model", level=2)
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(8)
    p.add_run("The total reflected light intensity $I$ at a surface point is calculated as the sum of Ambient, Diffuse (Lambertian), and Specular (Gloss) components:")

    # Phong Callout
    table_ph = doc.add_table(rows=1, cols=1)
    table_ph.alignment = WD_TABLE_ALIGNMENT.CENTER
    cph = table_ph.cell(0, 0)
    cph.width = Inches(6.5)
    set_cell_background(cph, "F8F9FA")
    set_cell_margins(cph, top=140, bottom=140, left=180, right=180)
    
    cpph = cph.paragraphs[0]
    cpph.paragraph_format.line_spacing = 1.2
    cpph.add_run("Phong Illumination Equation:\n\n").bold = True
    cpph.add_run("  I = I_ambient · K_a  +  I_sun · K_d · (N · L)  +  I_sun · K_s · (R · V)^n\n\n").bold = True
    cpph.add_run("Where:\n")
    cpph.add_run("  • I_ambient, I_sun = Incident light intensities (HemisphereLight & DirectionalLight)\n")
    cpph.add_run("  • K_a, K_d, K_s   = Ambient, Diffuse, and Specular reflection coefficients\n")
    cpph.add_run("  • N = Normalized Surface Normal Vector\n")
    cpph.add_run("  • L = Normalized Light Source Direction Vector\n")
    cpph.add_run("  • R = Perfect Reflection Vector (R = 2 · (N · L) · N - L)\n")
    cpph.add_run("  • V = View Direction Vector toward Camera\n")
    cpph.add_run("  • n = Specular Shininess Exponent (Material Roughness inverse)")

    add_heading_styled(doc, "4.2 Shadow Mapping (PCF Soft Shadows)", level=2)
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(8)
    p.add_run("Dynamic shadows are generated using Shadow Mapping with Percentage Closer Filtering (PCFSoftShadowMap). The directional sunlight light source constructs an orthographic shadow depth matrix. Pixels whose depth exceeds the shadow map depth value are rendered in shadow ($I_{diffuse} = 0, I_{specular} = 0$).")

    add_heading_styled(doc, "4.3 Wet Road Material Reflectivity", level=2)
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(8)
    p.add_run("When rain weather is toggled (M key), the asphalt road material's roughness parameter is dynamically modified from $0.80$ (dry asphalt) to $0.25$ (wet slick asphalt), instantly increasing specular reflectivity $(\\hat{N} \\cdot \\hat{L})$ under daylight and streetlights.")

    # ---------------------------------------------------------
    # SECTION 5: HIDDEN SURFACE REMOVAL & COLLISION (MODULE 6)
    # ---------------------------------------------------------
    add_heading_styled(doc, "5. Hidden Surface Removal, Collision Detection & Particles", level=1)

    add_heading_styled(doc, "5.1 Z-Buffer Algorithm & Back-Face Culling", level=2)
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(8)
    p.add_run("To ensure correct occlusion across overlapping 3D primitives (wheels, car chassis, obstacles), WebGL uses the hardware Z-Buffer Depth Test. Before writing a fragment color to the frame buffer, its depth value $z_{new}$ is compared against the existing depth $z_{buffer}(x,y)$. If $z_{new} < z_{buffer}(x,y)$, the pixel color is updated.")

    add_heading_styled(doc, "5.2 Axis-Aligned Bounding Box (AABB) Collision Detection", level=2)
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(8)
    p.add_run("Collision detection between the player car and dynamic lane obstacles is calculated every frame using Axis-Aligned Bounding Boxes (THREE.Box3). Two bounding boxes $A$ and $B$ overlap if and only if they intersect along all three spatial axes:")

    # Box3 Table
    table_b = doc.add_table(rows=1, cols=1)
    table_b.alignment = WD_TABLE_ALIGNMENT.CENTER
    cb = table_b.cell(0, 0)
    cb.width = Inches(6.5)
    set_cell_background(cb, "F8F9FA")
    set_cell_margins(cb, top=140, bottom=140, left=180, right=180)
    
    cpb = cb.paragraphs[0]
    cpb.paragraph_format.line_spacing = 1.2
    cpb.add_run("AABB Overlap Condition (THREE.Box3.intersectsBox):\n\n").bold = True
    cpb.add_run("  Overlap = (A.minX ≤ B.maxX  AND  A.maxX ≥ B.minX)  AND\n")
    cpb.add_run("            (A.minY ≤ B.maxY  AND  A.maxY ≥ B.minY)  AND\n")
    cpb.add_run("            (A.minZ ≤ B.maxZ  AND  A.maxZ ≥ B.minZ)\n\n").bold = True
    cpb.add_run("If true, the game triggers a collision crash sequence, emits crash debris particles, and displays the Game Over modal.")

    add_heading_styled(doc, "5.3 Dynamic Particle Systems (Rain, Smoke, Nitro)", level=2)
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(8)
    p.add_run("The custom ParticleSystem class handles real-time visual effects:\n")
    p.add_run("• Rain Simulation: ").bold = True
    p.add_run("Implemented efficiently using 1,200 points in a THREE.PointsBufferGeometry. Vertices fall downward ($Y_{new} = Y - v_{fall} \\cdot \\Delta t$) and wrap vertically when $Y < 0$.\n")
    p.add_run("• Tire Smoke & Nitro Exhaust: ").bold = True
    p.add_run("Dynamic mesh particles spawned at exhaust pipe coordinates $[x, y, z]$ with fading opacity $(\\text{opacity} = \\text{life} / \\text{maxLife})$ and expanding scale.")

    # ---------------------------------------------------------
    # SECTION 6: IMPLEMENTATION & VIVA PREPARATION
    # ---------------------------------------------------------
    add_heading_styled(doc, "6. Technical Architecture & Viva Examination Guide", level=1)

    add_heading_styled(doc, "6.1 Modular Software Class Architecture", level=2)

    # Class summary table
    arch_table = doc.add_table(rows=6, cols=2)
    arch_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Class / Module", "Primary Computer Graphics & System Responsibility"]
    
    for i, h in enumerate(headers):
        cell = arch_table.cell(0, i)
        cell.paragraphs[0].add_run(h).bold = True
        set_cell_background(cell, "003366")
        cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)

    modules_data = [
        ("HandbuiltCar.js", "Hierarchical 3D car model, lateral steering lerp, body roll tilt (R_z), wheel rotation."),
        ("RoadEnvironment.js", "3-lane road geometry, endless Z-axis scrolling, streetlight PointLights, wet road shader modification."),
        ("ObstacleManager.js", "Procedural obstacle spawning across 3 lanes, Box3 AABB collision testing."),
        ("CoinManager.js", "3D gold coin primitive generation, continuous Y-axis rotation, pickup collection logic."),
        ("ParticleSystem.js", "THREE.Points rain system, tire smoke, nitro exhaust flames, crash debris explosion.")
    ]

    for row_idx, (m_name, m_desc) in enumerate(modules_data, start=1):
        cell_name = arch_table.cell(row_idx, 0)
        cell_desc = arch_table.cell(row_idx, 1)
        cell_name.paragraphs[0].add_run(m_name).bold = True
        cell_desc.paragraphs[0].add_run(m_desc)
        bg = "F8F9FA" if row_idx % 2 == 1 else "FFFFFF"
        set_cell_background(cell_name, bg)
        set_cell_background(cell_desc, bg)
        set_cell_margins(cell_name, top=80, bottom=80, left=100, right=100)
        set_cell_margins(cell_desc, top=80, bottom=80, left=100, right=100)

    add_heading_styled(doc, "6.2 Computer Graphics Viva Examination Q&A Reference", level=2)

    viva_qas = [
        ("Q1: How is the player car constructed without importing GLB assets?",
         "Answer: Through Hierarchical Modeling using a THREE.Group parent container. Sub-meshes (body, cabin, spoiler, wheels) are created using primitives (BoxGeometry, CylinderGeometry) and transformed relative to the parent coordinate space."),
        
        ("Q2: How is endless forward motion achieved without moving the car infinitely along +Z?",
         "Answer: By moving the world environment, road markings, roadside trees, and obstacles toward the camera in the +Z direction (Z_pos += roadSpeed * Delta_t) while keeping the player car's Z coordinate static (z = 3.5)."),

        ("Q3: How does the application implement dynamic lighting and night mode?",
         "Answer: Using a combination of HemisphereLight for ambient sky/ground fill, DirectionalLight with PCFSoftShadowMap for sun shadows, roadside PointLights, and car SpotLights. Night mode adjusts light intensities and scene background color."),

        ("Q4: What algorithm is used for collision detection?",
         "Answer: Axis-Aligned Bounding Box (AABB) intersection testing via THREE.Box3.intersectsBox(), comparing the player car's 3D bounding box against active obstacle boxes every frame.")
    ]

    for q, a in viva_qas:
        qp = doc.add_paragraph()
        qp.paragraph_format.space_before = Pt(6)
        qp.paragraph_format.space_after = Pt(2)
        qp.add_run(q).bold = True
        qp.runs[0].font.color.rgb = RGBColor(0, 51, 102)

        ap = doc.add_paragraph()
        ap.paragraph_format.line_spacing = 1.15
        ap.paragraph_format.space_after = Pt(8)
        ap.add_run(a)

    # Conclusion
    add_heading_styled(doc, "7. Conclusion & Performance Optimization", level=1)
    p_concl = doc.add_paragraph()
    p_concl.paragraph_format.line_spacing = 1.15
    p_concl.paragraph_format.space_after = Pt(12)
    p_concl.add_run("The 3D Racing Simulator project successfully demonstrates fundamental and advanced Computer Graphics principles within a high-performance web environment. By capping renderer pixel ratio (Math.min(devicePixelRatio, 2)), reusing geometry buffers, employing instanced points for rain, and utilizing delta time integration, the application maintains a consistent 60 FPS rendering rate while delivering rich interactive gameplay suitable for academic evaluation.")

    # Save to file
    out_path = r"d:\racing\Computer_Graphics_Project_Report.docx"
    doc.save(out_path)
    print(f"Report saved successfully to {out_path}")

if __name__ == "__main__":
    generate_docx()
