import React from 'react';
import { FiBriefcase, FiAward, FiBook, FiMapPin, FiPhone, FiMail, FiGlobe, FiLinkedin } from 'react-icons/fi';

const Biography = () => {
  const user = {
    name: "Alex Johnson",
    title: "Senior Software Engineer & Tech Lead",
    location: "San Francisco, CA",
    email: "alex.johnson@example.com",
    phone: "(555) 123-4567",
    about: "Passionate software engineer with over 8 years of experience in building scalable web applications.",
    experience: [
      {
        role: "Senior Software Engineer",
        company: "TechCorp Inc.",
        period: "2020 - Present",
        description: "Leading a team of 5 developers to build and maintain enterprise-level applications."
      },
      {
        role: "Full Stack Developer",
        company: "WebSolutions LLC",
        period: "2017 - 2020",
        description: "Developed and maintained multiple client websites and web applications."
      }
    ],
    education: [
      {
        degree: "Master of Computer Science",
        institution: "Stanford University",
        period: "2015 - 2017"
      }
    ],
    skills: ["JavaScript", "React", "Node.js", "Python", "AWS", "Docker"],
    certifications: ["AWS Certified Solutions Architect"]
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-32 h-32 rounded-full bg-gray-200 mb-4 md:mb-0 md:mr-8">
              <img 
                src="https://randomuser.me/api/portraits/men/1.jpg" 
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold">{user.name}</h1>
              <p className="text-xl text-gray-600 mb-2">{user.title}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="flex items-center text-gray-600">
                  <FiMapPin className="mr-1" />
                  <span>{user.location}</span>
                </div>
                <a href={`mailto:${user.email}`} className="flex items-center text-blue-600">
                  <FiMail className="mr-1" />
                  <span>Email</span>
                </a>
                <a href={`tel:${user.phone}`} className="flex items-center text-gray-600">
                  <FiPhone className="mr-1" />
                  <span>Call</span>
                </a>
              </div>
            </div>
          </div>
          <p className="mt-6 text-gray-700">{user.about}</p>
        </div>

        {/* Experience */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <FiBriefcase className="mr-2" />
            Experience
          </h2>
          {user.experience.map((exp, idx) => (
            <div key={idx} className="mb-6 pb-6 border-b last:border-b-0 last:pb-0 last:mb-0">
              <h3 className="text-xl font-semibold">{exp.role}</h3>
              <div className="flex justify-between text-gray-600 mb-2">
                <span>{exp.company}</span>
                <span>{exp.period}</span>
              </div>
              <p className="text-gray-700">{exp.description}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Education */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <FiBook className="mr-2" />
              Education
            </h2>
            {user.education.map((edu, idx) => (
              <div key={idx} className="mb-6 last:mb-0">
                <h3 className="text-lg font-semibold">{edu.degree}</h3>
                <div className="text-gray-600">{edu.institution}</div>
                <div className="text-sm text-gray-500">{edu.period}</div>
              </div>
            ))}
          </div>

          {/* Skills & Certifications */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Skills</h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {user.skills.map((skill, idx) => (
                <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>

            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <FiAward className="mr-2" />
              Certifications
            </h2>
            <ul className="space-y-2">
              {user.certifications.map((cert, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>{cert}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Biography;