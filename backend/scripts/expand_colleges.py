"""
Expands the AICTE institutions directory with top Indian universities, IITs, NITs,
state technological universities, and accredited colleges across all Indian states.
"""

from datetime import datetime, timezone
from backend.app.core.database import SessionLocal
from backend.app.models.institution import Institution

COLLEGES_DATA = [
    # Delhi / NCR
    ("1-3001001", "Delhi Technological University (DTU)", "Delhi", "New Delhi", "State University"),
    ("1-3001002", "Indian Institute of Technology Delhi (IIT Delhi)", "Delhi", "New Delhi", "Central Institution"),
    ("1-3001003", "Netaji Subhas University of Technology (NSUT)", "Delhi", "South West Delhi", "State University"),
    ("1-3001004", "Indraprastha Institute of Information Technology (IIIT Delhi)", "Delhi", "South Delhi", "State University"),
    ("1-3001005", "Guru Gobind Singh Indraprastha University (GGSIPU)", "Delhi", "South West Delhi", "State University"),
    ("1-3001006", "Jamia Millia Islamia Faculty of Engineering", "Delhi", "South East Delhi", "Central University"),
    ("1-3001007", "Amity School of Engineering and Technology", "Uttar Pradesh", "Noida", "Private"),
    ("1-3001008", "Jaypee Institute of Information Technology (JIIT)", "Uttar Pradesh", "Noida", "Deemed University"),
    ("1-3001009", "Galgotias University School of Engineering", "Uttar Pradesh", "Greater Noida", "Private"),
    ("1-3001010", "JSS Academy of Technical Education", "Uttar Pradesh", "Noida", "Private"),

    # Maharashtra
    ("1-3001011", "Indian Institute of Technology Bombay (IIT Bombay)", "Maharashtra", "Mumbai", "Central Institution"),
    ("1-3001012", "College of Engineering Pune (COEP Technological University)", "Maharashtra", "Pune", "Autonomous / State"),
    ("1-3001013", "Veermata Jijabai Technological Institute (VJTI)", "Maharashtra", "Mumbai", "Govt Aided"),
    ("1-3001014", "Institute of Chemical Technology (ICT Mumbai)", "Maharashtra", "Mumbai", "Deemed University"),
    ("1-3001015", "Visvesvaraya National Institute of Technology (VNIT Nagpur)", "Maharashtra", "Nagpur", "Central Institution"),
    ("1-3001016", "Sardar Patel College of Engineering (SPCE)", "Maharashtra", "Mumbai", "Govt Aided"),
    ("1-3001017", "MIT World Peace University (MIT-WPU)", "Maharashtra", "Pune", "Private"),
    ("1-3001018", "Symbiosis Institute of Technology (SIT)", "Maharashtra", "Pune", "Private"),
    ("1-3001019", "Walchand College of Engineering", "Maharashtra", "Sangli", "Govt Aided"),
    ("1-3001020", "Government College of Engineering Aurangabad", "Maharashtra", "Chhatrapati Sambhajinagar", "Government"),

    # Karnataka
    ("1-3001021", "National Institute of Technology Karnataka (NIT Surathkal)", "Karnataka", "Mangaluru", "Central Institution"),
    ("1-3001022", "R.V. College of Engineering (RVCE)", "Karnataka", "Bengaluru Urban", "Autonomous"),
    ("1-3001023", "BMS College of Engineering (BMSCE)", "Karnataka", "Bengaluru Urban", "Autonomous"),
    ("1-3001024", "M.S. Ramaiah Institute of Technology (MSRIT)", "Karnataka", "Bengaluru Urban", "Autonomous"),
    ("1-3001025", "PES University", "Karnataka", "Bengaluru Urban", "Private"),
    ("1-3001026", "International Institute of Information Technology Bangalore (IIITB)", "Karnataka", "Bengaluru Urban", "Deemed University"),
    ("1-3001027", "Manipal Institute of Technology (MIT Manipal)", "Karnataka", "Udupi", "Deemed University"),
    ("1-3001028", "University Visvesvaraya College of Engineering (UVCE)", "Karnataka", "Bengaluru Urban", "State University"),
    ("1-3001029", "Siddaganga Institute of Technology", "Karnataka", "Tumakuru", "Autonomous"),

    # Tamil Nadu
    ("1-3001030", "Indian Institute of Technology Madras (IIT Madras)", "Tamil Nadu", "Chennai", "Central Institution"),
    ("1-3001031", "College of Engineering Guindy (Anna University)", "Tamil Nadu", "Chennai", "State University"),
    ("1-3001032", "National Institute of Technology Tiruchirappalli (NIT Trichy)", "Tamil Nadu", "Tiruchirappalli", "Central Institution"),
    ("1-3001033", "PSG College of Technology", "Tamil Nadu", "Coimbatore", "Govt Aided / Autonomous"),
    ("1-3001034", "Vellore Institute of Technology (VIT University)", "Tamil Nadu", "Vellore", "Deemed University"),
    ("1-3001035", "SRM Institute of Science and Technology", "Tamil Nadu", "Chengalpattu", "Deemed University"),
    ("1-3001036", "Coimbatore Institute of Technology (CIT)", "Tamil Nadu", "Coimbatore", "Govt Aided"),
    ("1-3001037", "SSN College of Engineering", "Tamil Nadu", "Kanchipuram", "Autonomous"),
    ("1-3001038", "Thiagarajar College of Engineering", "Tamil Nadu", "Madurai", "Govt Aided"),

    # Uttar Pradesh
    ("1-3001039", "Indian Institute of Technology Kanpur (IIT Kanpur)", "Uttar Pradesh", "Kanpur", "Central Institution"),
    ("1-3001040", "Indian Institute of Technology (BHU) Varanasi", "Uttar Pradesh", "Varanasi", "Central Institution"),
    ("1-3001041", "Motilal Nehru National Institute of Technology (MNNIT Allahabad)", "Uttar Pradesh", "Prayagraj", "Central Institution"),
    ("1-3001042", "Harcourt Butler Technical University (HBTU)", "Uttar Pradesh", "Kanpur", "State University"),
    ("1-3001043", "Kamla Nehru Institute of Technology (KNIT)", "Uttar Pradesh", "Sultanpur", "Government"),
    ("1-3001044", "Institute of Engineering and Technology (IET Lucknow)", "Uttar Pradesh", "Lucknow", "Government"),
    ("1-3001045", "Ajay Kumar Garg Engineering College (AKGEC)", "Uttar Pradesh", "Ghaziabad", "Private"),

    # Telangana & Andhra Pradesh
    ("1-3001046", "Indian Institute of Technology Hyderabad (IIT Hyderabad)", "Telangana", "Sangareddy", "Central Institution"),
    ("1-3001047", "National Institute of Technology Warangal (NIT Warangal)", "Telangana", "Warangal", "Central Institution"),
    ("1-3001048", "International Institute of Information Technology Hyderabad (IIITH)", "Telangana", "Hyderabad", "Autonomous"),
    ("1-3001049", "JNTU College of Engineering Hyderabad", "Telangana", "Hyderabad", "State University"),
    ("1-3001050", "Chaitanya Bharathi Institute of Technology (CBIT)", "Telangana", "Hyderabad", "Autonomous"),
    ("1-3001051", "Andhra University College of Engineering", "Andhra Pradesh", "Visakhapatnam", "State University"),
    ("1-3001052", "Koneru Lakshmaiah Education Foundation (KL University)", "Andhra Pradesh", "Guntur", "Deemed University"),
    ("1-3001053", "National Institute of Technology Andhra Pradesh (NIT AP)", "Andhra Pradesh", "Tadepalligudem", "Central Institution"),

    # West Bengal & East
    ("1-3001054", "Indian Institute of Technology Kharagpur (IIT Kharagpur)", "West Bengal", "Paschim Medinipur", "Central Institution"),
    ("1-3001055", "Jadavpur University Faculty of Engineering & Tech", "West Bengal", "Kolkata", "State University"),
    ("1-3001056", "Indian Institute of Engineering Science and Technology (IIEST Shibpur)", "West Bengal", "Howrah", "Central Institution"),
    ("1-3001057", "National Institute of Technology Durgapur (NIT Durgapur)", "West Bengal", "Paschim Bardhaman", "Central Institution"),
    ("1-3001058", "Heritage Institute of Technology", "West Bengal", "Kolkata", "Autonomous"),
    ("1-3001059", "National Institute of Technology Rourkela (NIT Rourkela)", "Odisha", "Sundargarh", "Central Institution"),
    ("1-3001060", "Kalinga Institute of Industrial Technology (KIIT)", "Odisha", "Bhubaneswar", "Deemed University"),
    ("1-3001061", "Indian Institute of Technology Patna (IIT Patna)", "Bihar", "Patna", "Central Institution"),
    ("1-3001062", "National Institute of Technology Patna (NIT Patna)", "Bihar", "Patna", "Central Institution"),

    # Gujarat & Rajasthan
    ("1-3001063", "Indian Institute of Technology Gandhinagar (IIT Gandhinagar)", "Gujarat", "Gandhinagar", "Central Institution"),
    ("1-3001064", "Sardar Vallabhbhai National Institute of Technology (SVNIT)", "Gujarat", "Surat", "Central Institution"),
    ("1-3001065", "Nirma University Institute of Technology", "Gujarat", "Ahmedabad", "Private"),
    ("1-3001066", "Pandit Deendayal Energy University (PDEU)", "Gujarat", "Gandhinagar", "Private"),
    ("1-3001067", "L.D. College of Engineering", "Gujarat", "Ahmedabad", "Government"),
    ("1-3001068", "Birla Institute of Technology and Science (BITS Pilani)", "Rajasthan", "Jhunjhunu", "Deemed University"),
    ("1-3001069", "Malaviya National Institute of Technology (MNIT Jaipur)", "Rajasthan", "Jaipur", "Central Institution"),
    ("1-3001070", "Indian Institute of Technology Jodhpur (IIT Jodhpur)", "Rajasthan", "Jodhpur", "Central Institution"),
    ("1-3001071", "The LNM Institute of Information Technology (LNMIIT)", "Rajasthan", "Jaipur", "Autonomous"),

    # Punjab, Chandigarh, Haryana, Uttarakhand, HP
    ("1-3001072", "Punjab Engineering College (PEC)", "Chandigarh", "Chandigarh", "Deemed University"),
    ("1-3001073", "Thapar Institute of Engineering and Technology", "Punjab", "Patiala", "Deemed University"),
    ("1-3001074", "National Institute of Technology Kurukshetra (NIT Kurukshetra)", "Haryana", "Kurukshetra", "Central Institution"),
    ("1-3001075", "Indian Institute of Technology Roorkee (IIT Roorkee)", "Uttarakhand", "Haridwar", "Central Institution"),
    ("1-3001076", "National Institute of Technology Hamirpur (NIT Hamirpur)", "Himachal Pradesh", "Hamirpur", "Central Institution"),
    ("1-3001077", "Dr. B R Ambedkar National Institute of Technology (NIT Jalandhar)", "Punjab", "Jalandhar", "Central Institution"),
    ("1-3001078", "Graphic Era University", "Uttarakhand", "Dehradun", "Deemed University"),

    # Kerala & Central / Northeast
    ("1-3001079", "National Institute of Technology Calicut (NIT Calicut)", "Kerala", "Kozhikode", "Central Institution"),
    ("1-3001080", "College of Engineering Trivandrum (CET)", "Kerala", "Thiruvananthapuram", "Government"),
    ("1-3001081", "Indian Institute of Technology Indore (IIT Indore)", "Madhya Pradesh", "Indore", "Central Institution"),
    ("1-3001082", "Maulana Azad National Institute of Technology (MANIT Bhopal)", "Madhya Pradesh", "Bhopal", "Central Institution"),
    ("1-3001083", "Shri Govindram Seksaria Institute of Technology and Science (SGSITS)", "Madhya Pradesh", "Indore", "Autonomous"),
    ("1-3001084", "Indian Institute of Technology Guwahati (IIT Guwahati)", "Assam", "Kamrup", "Central Institution"),
    ("1-3001085", "National Institute of Technology Silchar (NIT Silchar)", "Assam", "Cachar", "Central Institution"),
]


def expand_institutions():
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        existing_names = {inst.name.lower() for inst in db.query(Institution).all()}
        existing_aicte_ids = {inst.aicte_permanent_id for inst in db.query(Institution).all()}
        
        added_count = 0
        for aicte_id, name, state, district, inst_type in COLLEGES_DATA:
            if aicte_id in existing_aicte_ids or name.lower() in existing_names:
                continue

            inst = Institution(
                aicte_permanent_id=aicte_id,
                name=name,
                state=state,
                district=district,
                institution_type=inst_type,
                is_active=True,
                created_at=now,
            )
            db.add(inst)
            added_count += 1

        db.commit()
        total_now = db.query(Institution).count()
        print(f"Successfully added {added_count} new institutions. Total institutions in database: {total_now}.")
    finally:
        db.close()


if __name__ == "__main__":
    expand_institutions()
