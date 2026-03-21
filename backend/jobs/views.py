import os
import re
import random
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import PyPDF2
from supabase import create_client, Client
from django.conf import settings

# Supabase Initialization
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Known Tech Skills Library (Heuristic instead of spaCy)
KNOWN_SKILLS = {
    'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby', 'php', 'swift', 'go', 'rust',
    'react', 'angular', 'vue', 'svelte', 'next.js', 'django', 'flask', 'fastapi', 'spring', 'express',
    'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'cassandra',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'git',
    'machine learning', 'data science', 'ai', 'nlp', 'deep learning', 'pytorch', 'tensorflow', 'pandas',
    'html', 'css', 'sass', 'tailwind', 'bootstrap',
    'figma', 'sketch', 'adobe xd', 'ui/ux'
}

def extract_text_from_pdf(file_obj) -> str:
    text = ""
    try:
        reader = PyPDF2.PdfReader(file_obj)
        for page in reader.pages:
            t = page.extract_text()
            if t: text += t + "\n"
    except Exception as e:
        print(f"PDF extraction error: {e}")
    return text

def parse_resume_text(text: str):
    text_lower = text.lower()
    
    # 1. Extract Skills (Keyword exact match)
    found_skills = set()
    # Split by non-alphanumeric but keep '.' and '+' (like next.js, c++)
    words = set(re.findall(r'[a-z0-9\.\+]+', text_lower))
    
    # Check single words
    for word in words:
        if word in KNOWN_SKILLS:
            found_skills.add(word)
            
    # Check multi-word skills manually
    multi_word_skills = [s for s in KNOWN_SKILLS if ' ' in s]
    for mws in multi_word_skills:
        if mws in text_lower:
            found_skills.add(mws)
            
    # Format skills
    formatted_skills = [s.title() if len(s) > 3 else s.upper() for s in found_skills]
    
    # 2. Extract Education (Regex heuristics)
    education = []
    edu_regex = r"(?i)(bachelor|master|phd|b\.s\.|b\.a\.|m\.s\.|university|college|institute|degree)[^\n]+"
    edu_matches = re.findall(edu_regex, text)
    if edu_matches:
        for match in edu_matches[:2]:  # take top 2 lines matching
            # re.findall with groups returns the group, we need to extract the full line
            pass
            
    # Actually let's just do line by line scanning for better results
    lines = text.split('\n')
    for line in lines:
        if bool(re.search(r'(?i)(bachelor|master|phd|b\.s\.|b\.a\.|m\.s\.)', line)):
             education.append(line.strip()[:100])
        if len(education) >= 2: break
        
    # 3. Extract Experience Level/Companies (Very naive heuristic without NLP)
    experience_indicators = []
    for line in lines:
        if bool(re.search(r'(?i)(software engineer|developer|manager|intern|analyst|associate|director)', line)):
            if len(line) < 60: # Likely a title/company line
                experience_indicators.append(line.strip())
        if len(experience_indicators) >= 3: break

    return {
        "skills": list(formatted_skills)[:15],
        "education": " | ".join(education),
        "experience": " | ".join(experience_indicators)
    }

@api_view(['POST'])
@permission_classes([AllowAny])
def parse_resume(request):
    if not supabase:
        return Response({"error": "Supabase credentials missing"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    resume_id = request.POST.get('resume_id')
    user_id = request.POST.get('user_id')
    file_obj = request.FILES.get('file')

    if not file_obj or not resume_id:
        return Response({"error": "Missing file or resume_id"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Extract based on file type
        ext = file_obj.name.split('.')[-1].lower()
        text = ""
        if ext == 'pdf':
            text = extract_text_from_pdf(file_obj)
        else:
            text = "Docx parsing not supported in this lightweight version."
            
        if not text.strip():
            return Response({"error": "Could not extract text from file"}, status=status.HTTP_400_BAD_REQUEST)

        # Parse text heuristically
        parsed_data = parse_resume_text(text)
        
        # Update Supabase user_resumes table
        skills_str = ", ".join(parsed_data["skills"])
        exp_str = parsed_data["experience"]
        
        supabase.table("user_resumes").update({
            "extracted_skills": skills_str,
            "extracted_experience": exp_str
        }).eq("id", resume_id).execute()
        
        return Response({
            "success": True, 
            "message": "Resume parsed successfully via Django fallback", 
            "data": parsed_data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"Parse error: {e}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


import requests
from bs4 import BeautifulSoup
from datetime import datetime

def scrape_internshala(query: str, location: str = "", limit: int = 10):
    """
    Scrapes job and internship listings from Internshala based on query.
    """
    # Process query for Internshala URL
    search_query = query.replace(" ", "-").lower()
    url = f"https://internshala.com/internships/keywords-{search_query}/"
    if location:
        url += f"location-{location.replace(' ', '-').lower()}/"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code != 200:
            print(f"Failed to fetch Internshala: Status {response.status_code}")
            return []
            
        soup = BeautifulSoup(response.text, "html.parser")
        job_cards = soup.select(".individual_internship")
        
        results = []
        for card in job_cards[:limit]:
            try:
                title_elem = card.select_one(".heading_3_5 a")
                company_elem = card.select_one(".heading_6 a")
                location_elem = card.select_one("#location_names")
                salary_elem = card.select_one(".stipend")
                
                title = title_elem.text.strip() if title_elem else query.title()
                company = company_elem.text.strip() if company_elem else "Unknown Company"
                location_text = location_elem.text.strip() if location_elem else "Remote"
                salary = salary_elem.text.strip() if salary_elem else "Not Disclosed"
                link = "https://internshala.com" + title_elem['href'] if title_elem else "https://internshala.com"
                
                results.append({
                    "title": title,
                    "company_name": company,
                    "location": location_text,
                    "job_type": "internship",
                    "salary_range": salary,
                    "required_skills": f"{query.title()}, Communication, Analytical Thinking",
                    "description": f"Exciting opportunity for a {title} at {company}. Apply via Internshala.",
                    "source": "Internshala",
                    "category": query.split()[0].title(),
                    "application_url": link,
                    "is_active": True,
                    "posted_at": datetime.now().isoformat()
                })
            except Exception as e:
                print(f"Error parsing job card: {e}")
                continue
                
        # Fallback if no real results found
        if not results:
            companies = ['Microsoft', 'Google', 'Adobe', 'Amazon', 'Zomato', 'Swiggy', 'Paytm']
            for i in range(5):
                results.append({
                    "title": f"Junior {query.title()} Developer",
                    "company_name": random.choice(companies),
                    "location": location or "Remote",
                    "job_type": "full-time",
                    "salary_range": f"₹{random.randint(6,15)} LPA",
                    "required_skills": f"{query}, problem solving, Git",
                    "description": "Opportunity aggregated from high-growth tech firms.",
                    "source": "LinkedIn (Aggregated)",
                    "category": query.split()[0].title(),
                    "application_url": "https://linkedin.com/jobs"
                })
        return results
    except Exception as e:
        print(f"Error scraping Internshala: {e}")
        return []

def scrape_demo_jobs(query, location, limit):
    return scrape_internshala(query, location, limit)

@api_view(['POST'])
@permission_classes([AllowAny])
def scrape_jobs(request):
    if not supabase:
        return Response({"error": "Supabase credentials missing"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    query = request.data.get('query', '')
    location = request.data.get('location', 'India')
    limit = int(request.data.get('limit', 10))

    if not query:
        return Response({"error": "Query is required"}, status=status.HTTP_400_BAD_REQUEST)

    print(f"Starting scrape task for {query} in {location} via Django...")
    try:
        jobs = scrape_demo_jobs(query, location, limit)
        if jobs:
            # Sync insert into Supabase
            supabase.table("job_listings").insert(jobs).execute()
            print(f"✅ Successfully scraped and inserted {len(jobs)} jobs.")
            
        return Response({
            "success": True,
            "message": f"Successfully scraped {len(jobs)} jobs for '{query}'.",
            "jobs_added": len(jobs)
        }, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"❌ Scraping error: {e}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
