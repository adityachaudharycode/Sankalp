export default function Testimonials() {
  const testimonials = [
    {
      name: "Priya Sharma",
      role: "NGO Volunteer",
      location: "Mumbai",
      image: "👩‍💼",
      quote: "SANKALP has revolutionized how we connect with communities in need. The real-time issue tracking and points system keeps our volunteers motivated and engaged.",
      rating: 5
    },
    {
      name: "Rajesh Kumar",
      role: "School Principal",
      location: "Delhi",
      image: "👨‍🏫",
      quote: "The meal distribution tracking with AI verification has brought complete transparency to our mid-day meal program. Parents and government officials can see exactly what's happening.",
      rating: 5
    },
    {
      name: "Anita Das",
      role: "Government Official",
      location: "Kolkata",
      image: "👩‍💻",
      quote: "The comprehensive dashboard gives us unprecedented visibility into community issues and volunteer activities. Data-driven decision making has never been easier.",
      rating: 5
    },
    {
      name: "Mohammed Ali",
      role: "Community Member",
      location: "Hyderabad",
      image: "👨‍🦱",
      quote: "I reported a water shortage issue through the app, and within 2 days, local volunteers had organized a solution. The multilingual support made it so easy to use.",
      rating: 5
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Stories of Impact
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real people, real change. See how SANKALP is transforming communities across India.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:rotate-1 animate-fade-in-up cursor-pointer border border-gray-100 hover:border-blue-200"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="flex items-center mb-4">
                <div className="text-4xl mr-4 group-hover:scale-110 transition-transform duration-300">{testimonial.image}</div>
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">{testimonial.role}</p>
                  <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">📍 {testimonial.location}</p>
                </div>
              </div>
              
              <div className="flex mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg group-hover:scale-110 transition-transform duration-300" style={{ animationDelay: `${i * 100}ms` }}>⭐</span>
                ))}
              </div>
              
              <blockquote className="text-gray-700 italic leading-relaxed group-hover:text-gray-800 transition-colors">
                "{testimonial.quote}"
              </blockquote>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
