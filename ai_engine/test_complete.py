# test_complete_system.py
import asyncio
from podcast_guest_tracker import OneClickPodcastGuestTracker

async def test_complete_analysis():
    print("🚀 Testing Complete Podcast Guest Tracker System")
    print("=" * 60)
    
    # Initialize the tracker
    tracker = OneClickPodcastGuestTracker()
    
    # Test with sample data
    guest_name = "Elon Musk"
    guest_url = "https://twitter.com/elonmusk"
    host_channel = "https://youtube.com/@lexfridman"
    
    print(f"Testing with:")
    print(f"Guest: {guest_name}")
    print(f"Guest URL: {guest_url}")
    print(f"Host Channel: {host_channel}")
    print("-" * 60)
    
    try:
        # Run complete analysis
        result = await tracker.analyze_podcast_guest_complete(
            guest_name=guest_name,
            guest_url=guest_url,
            host_channel_url=host_channel
        )
        
        if 'error' in result:
            print(f"❌ Analysis failed: {result['error']}")
        else:
            print("\n🎉 ANALYSIS COMPLETE!")
            print("=" * 60)
            
            # Display summary
            summary = result['recommendation_summary']
            print(f"📊 Overall Score: {summary['overall_score']}/100")
            print(f"💡 Recommendation: {summary['recommendation']}")
            print(f"🎯 Confidence: {summary['confidence']}")
            
            print(f"\n📋 Key Decision Factors:")
            for factor in summary['key_decision_factors']:
                print(f"   • {factor}")
            
            print(f"\n⏱️  Analysis Time: {result['analysis_metadata']['total_analysis_time']}s")
            
            # Save detailed report
            with open('sample_analysis_report.txt', 'w') as f:
                f.write(result['final_report'])
            print(f"\n📄 Detailed report saved to: sample_analysis_report.txt")
            
            print("\n✅ Complete system test PASSED!")
            
    except Exception as e:
        print(f"❌ System test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_complete_analysis())

